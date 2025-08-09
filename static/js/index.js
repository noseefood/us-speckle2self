window.HELP_IMPROVE_VIDEOJS = false;


$(document).ready(function() {
    var exampleManifest = {};
    var exampleLabels = {};
    var methodLabels = {};
    var manifestLoaded = false;

    function initializeUI() {
        var methods = [
			"Input",
			"OurMethod_gamma1.5",
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
            preloadImages([leftSrc, rightSrc], function() {
                $('#juxtapose-slider').remove();
                var sliderDiv = $('<div></div>').attr('id', 'juxtapose-slider').css('width', '100%');
                $('#juxtapose-slider-container').append(sliderDiv);
                setTimeout(function() {
                    new juxtapose.JXSlider('#juxtapose-slider', [
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