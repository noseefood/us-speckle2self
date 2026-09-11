window.HELP_IMPROVE_VIDEOJS = false;


$(document).ready(function() {
    var exampleManifest = {};
    var exampleLabels = {};
    var methodLabels = {};
    var manifestLoaded = false;

    // Auto sweep: the handle drifts back and forth around the centre line until
    // the visitor grabs it, after which it stays wherever they leave it.
    var AUTO_PERIOD = 6000;    // ms for one full left-right-left cycle
    var AUTO_AMPLITUDE = 45;   // percent of the width to either side of centre
    var autoSlide = true;
    var autoFrame = null;
    var currentSlider = null;
    var sliderRequest = 0;     // bumped per rebuild; only the newest may touch the DOM

    function setSliderPosition(slider, percent) {
        if (percent < 1) percent = 1;
        if (percent > 99) percent = 99;
        var left = percent.toFixed(2) + '%';
        slider.handle.style.left = left;
        slider.leftImage.style.width = left;
        slider.rightImage.style.width = (100 - percent).toFixed(2) + '%';
        slider.sliderPosition = left;
    }

    // JXSlider puts each method name inside its own image panel, which is
    // width-animated and overflow:hidden -- so the sweeping divider crops the
    // name and passes over it. Re-parent both onto .jx-slider, where the CSS
    // pins them to the outer edges above the handle.
    function pinLabels(slider) {
        if (!slider || !slider.slider) return false;
        var $labels = $(slider.slider).find('.jx-label');
        if (!$labels.length) return false;
        $labels.each(function() {
            var side = $(this).closest('.jx-image').hasClass('jx-left') ? 'left' : 'right';
            $(this).addClass('jx-label-pinned jx-label-pinned-' + side);
            slider.slider.appendChild(this);
        });
        return true;
    }

    // The labels only exist once both images have loaded and _init has run.
    function pinLabelsWhenReady(slider) {
        var tries = 0;
        (function attempt() {
            if (slider !== currentSlider) return;
            if (pinLabels(slider)) return;
            if (++tries < 60) window.setTimeout(attempt, 50);
        })();
    }

    function stopAutoSlide() {
        if (autoFrame !== null) {
            window.cancelAnimationFrame(autoFrame);
            autoFrame = null;
        }
    }

    function disableAutoSlide() {
        autoSlide = false;
        stopAutoSlide();
    }

    function startAutoSlide(slider, startPercent) {
        stopAutoSlide();
        if (!autoSlide || !slider || !window.requestAnimationFrame) return;

        // Pick the phase that matches where the handle already sits, so switching
        // method or frame does not make the sweep jump.
        var offset = (startPercent - 50) / AUTO_AMPLITUDE;
        if (offset > 1) offset = 1;
        if (offset < -1) offset = -1;
        var phase = Math.asin(offset);
        var lastTs = null;

        function step(ts) {
            if (!autoSlide || slider !== currentSlider) {
                autoFrame = null;
                return;
            }
            // The images load asynchronously; hold the phase until JXSlider is built.
            if (slider.handle && slider.leftImage && slider.rightImage) {
                if (lastTs !== null) {
                    var dt = ts - lastTs;
                    if (dt > 100) dt = 16; // returning from a hidden tab
                    phase += dt / AUTO_PERIOD * 2 * Math.PI;
                }
                setSliderPosition(slider, 50 + AUTO_AMPLITUDE * Math.sin(phase));
            }
            lastTs = ts;
            autoFrame = window.requestAnimationFrame(step);
        }
        autoFrame = window.requestAnimationFrame(step);
    }

    function initializeUI() {
        var methods = [
			"Input",
			"OurMethod_gamma2.0",
			"bm3d",
			"nlm",
			"obnlm",
			"srad",
			"dipSingle",
			"n2v",
			"neigh2neigh",
			"zsn2nSingle"
        ];

        var currentExample = Object.keys(exampleManifest)[0];
        var currentFrame = null;

        function getImagePath(example, method, frame) {
            // return "static/images/comparisons/" + example + "/" + method + "_az_" + frame + ".gif";

			frame = frame.toString().padStart(2, '0'); // Ensure frame is 3 digits
			
			return "static/images/comparisons/" + example + "/" + method + "_" + frame + ".gif";
        }

        function preloadImages(srcs, callback) {
            var loaded = 0;
            var total = srcs.length;
            var done = false;
            srcs.forEach(function(src) {
                var img = new window.Image();
                img.onload = img.onerror = function() {
                    loaded++;
                    if (!done && loaded === total) {
                        done = true;
                        callback();
                    }
                };
                img.src = src;
            });
        }

        function updateJuxtaposeSlider(example, left, right, frame) {
            var leftSrc = getImagePath(example, left, frame);
            var rightSrc = getImagePath(example, right, frame);
            var startingPosition = "50%";
            var $oldSlider = $('#juxtapose-slider');
            if ($oldSlider.length) {
                var $handle = $oldSlider.find('.jx-handle');
                if ($handle.length) {
                    var handleLeft = parseFloat($handle.css('left'));
                    var width = $oldSlider.width();
                    if (width > 0) {
                        var percent = Math.round((handleLeft / width) * 100);
                        startingPosition = percent + "%";
                    }
                }
            }
            var request = ++sliderRequest;
            preloadImages([leftSrc, rightSrc], function() {
                // Dragging the frame slider fires many rebuilds; a slower,
                // older preload must not replace the newer frame.
                if (request !== sliderRequest) return;
                stopAutoSlide();
                currentSlider = null;
                $('#juxtapose-slider').remove();
                var sliderDiv = $('<div></div>').attr('id', 'juxtapose-slider').css('width', '100%');
                $('#juxtapose-slider-container').append(sliderDiv);
                setTimeout(function() {
                    if (request !== sliderRequest) return;
                    var slider = new juxtapose.JXSlider('#juxtapose-slider', [
                        {
                            src: leftSrc,
                            label: methodLabels[left] || left,
                            credit: ''
                        },
                        {
                            src: rightSrc,
                            label: methodLabels[right] || right,
                            credit: ''
                        }
                    ], {
                        animate: true,
                        showLabels: true,
                        showCredits: false,
                        startingPosition: startingPosition,
                        makeResponsive: true
                    });
                    // JXSlider resolves '#juxtapose-slider' only once its images
                    // load, so a superseded instance would build into the newer
                    // container and stack a second slider under the first.
                    var build = slider._onLoaded;
                    slider._onLoaded = function() {
                        if (slider === currentSlider) build.call(slider);
                    };
                    currentSlider = slider;
                    pinLabelsWhenReady(currentSlider);
                    startAutoSlide(currentSlider, parseFloat(startingPosition));
                }, 0);
            });
        }

        function populateDropdowns() {
            var $left = $('#juxtapose-method-left');
            var $right = $('#juxtapose-method-right');
            $left.empty();
            $right.empty();
            methods.forEach(function(m) {
                $left.append($('<option>').val(m).text(methodLabels[m] || m));
                $right.append($('<option>').val(m).text(methodLabels[m] || m));
            });
            $left.val(methods[0]);
            $right.val(methods[1]);
        }

        function populateExampleDropdown() {
            var $example = $('#example-dropdown');
            $example.empty();
            Object.keys(exampleManifest).forEach(function(ex) {
                $example.append($('<option>').val(ex).text(exampleLabels[ex] || ex));
            });
            $example.val(currentExample);
        }

        function setFrameSlider(example, frame) {
            var indices = exampleManifest[example];
            var $frameSlider = $('#frame-slider');
            var $frameValue = $('#frame-slider-value');
            if (frame < 0) frame = 0;
            if (frame >= indices.length) frame = indices.length - 1;
            $frameSlider.attr('min', 0);
            $frameSlider.attr('max', indices.length - 1);
            $frameSlider.val(frame);
            $frameValue.text(indices[frame]);
        }

        function getCurrentFrameIndex(example) {
            var indices = exampleManifest[example];
            var $frameSlider = $('#frame-slider');
            var idx = parseInt($frameSlider.val());
            if (isNaN(idx) || idx < 0) idx = 0;
            if (idx >= indices.length) idx = indices.length - 1;
            return idx;
        }

        if ($('#juxtapose-slider-container').length) {
            // Bound on the container, which outlives each rebuilt JXSlider.
            $('#juxtapose-slider-container').on('mousedown touchstart keydown', disableAutoSlide);

            if ($('#example-dropdown').length === 0) {
                var $dropdown = $('<div class="select is-small is-rounded" style="min-width:130px; margin-bottom:1em;"><select id="example-dropdown"></select></div>');
                $('#juxtapose-slider-container').before($dropdown);
            }

            populateExampleDropdown();
            populateDropdowns();

            function resetFrameSlider(example) {
                var indices = exampleManifest[example];
                var mid = Math.floor(indices.length / 2);
                setFrameSlider(example, mid);
                currentFrame = mid;
            }

            resetFrameSlider(currentExample);

            updateJuxtaposeSlider(
                currentExample,
                $('#juxtapose-method-left').val(),
                $('#juxtapose-method-right').val(),
                exampleManifest[currentExample][getCurrentFrameIndex(currentExample)]
            );

            function getCurrentMethods() {
                return [
                    $('#juxtapose-method-left').val(),
                    $('#juxtapose-method-right').val()
                ];
            }

            $('#example-dropdown').on('change', function() {
                currentExample = $(this).val();
                resetFrameSlider(currentExample);
                var [left, right] = getCurrentMethods();
                updateJuxtaposeSlider(
                    currentExample,
                    left,
                    right,
                    exampleManifest[currentExample][getCurrentFrameIndex(currentExample)]
                );
            });

            $('#juxtapose-method-left, #juxtapose-method-right').on('change', function() {
                var left = $('#juxtapose-method-left').val();
                var right = $('#juxtapose-method-right').val();
                if (left === right) {
                    var idx = methods.indexOf(left);
                    var other = (idx + 1) % methods.length;
                    if ($(this).attr("id") === "juxtapose-method-left") {
                        $('#juxtapose-method-right').val(methods[other]);
                    } else {
                        $('#juxtapose-method-left').val(methods[other]);
                    }
                    left = $('#juxtapose-method-left').val();
                    right = $('#juxtapose-method-right').val();
                }
                updateJuxtaposeSlider(
                    currentExample,
                    left,
                    right,
                    exampleManifest[currentExample][getCurrentFrameIndex(currentExample)]
                );
            });

            $('#frame-slider').on('input change', function() {
                var idx = parseInt($(this).val());
                var indices = exampleManifest[currentExample];
                if (isNaN(idx) || idx < 0) idx = 0;
                if (idx >= indices.length) idx = indices.length - 1;
                $('#frame-slider-value').text(indices[idx]);
                var [left, right] = getCurrentMethods();
                updateJuxtaposeSlider(
                    currentExample,
                    left,
                    right,
                    indices[idx]
                );
            });
        }
    }

    $.getJSON('static/images/comparisons/manifest.json', function(data) {
        exampleManifest = data.examples;
        exampleLabels = data.labels;
        methodLabels = data.methodLabels || {};
        manifestLoaded = true;
        initializeUI();
    }).fail(function() {
        alert("Failed to load example manifest.");
    });
});