document.addEventListener('deviceready', async function() {
    let useBackCamera = true; // Flag to determine which camera to use
    const permissions = cordova.plugins.permissions;

    // Request camera permission asynchronously
    async function requestCameraPermission() {
        const permission = cordova.plugins.permissions.CAMERA;

        return new Promise((resolve, reject) => {
            cordova.plugins.permissions.checkPermission(permission, function(status) {
                if (status.hasPermission) {
                    resolve();
                } else {
                    cordova.plugins.permissions.requestPermission(permission, function(status) {
                        if (status.hasPermission) resolve();
                        else reject('Camera permission is not granted');
                    }, function() {
                        reject('Camera permission request failed');
                    });
                }
            }, function() {
                reject('Failed to check camera permission');
            });
        });
    }

    // Toggle camera open/close
    window.toggleCamera = async function() {
        const video = document.getElementById('video');
        const cameraButton = document.getElementById('cameraButton');
        const captureButton = document.getElementById('captureButton');
        const switchButton = document.getElementById('switchCameraButton');

        try {
            await requestCameraPermission();
            openCamera(); // Open the camera
            cameraButton.style.display = 'inline';
        } catch (error) {
            console.error('Error with camera access or permission:', error);
            alert(error);
        }
    };

    // Open the camera using the Cordova Camera plugin
    function openCamera() {
        navigator.camera.getPicture(
            function(imageData) {
                // Display the captured image in the canvas
                const canvas = document.getElementById('canvas');
                const context = canvas.getContext('2d');
                const img = new Image();
                img.onload = function() {
                    // Dynamically adjust the canvas size based on image orientation
                    const aspectRatio = img.width / img.height;
                    if (aspectRatio > 1) {
                        // Landscape
                        canvas.width = 400;
                        canvas.height = 400 / aspectRatio;
                    } else {
                        // Portrait
                        canvas.height = 400;
                        canvas.width = 400 * aspectRatio;
                    }
                    context.drawImage(img, 0, 0, canvas.width, canvas.height);
                    document.getElementById('capturedImage').src = canvas.toDataURL('image/jpeg');
                    document.getElementById('capturedImage').style.display = 'block';
                };
                img.src = "data:image/jpeg;base64," + imageData;
            },
            function(error) {
                console.error('Error accessing the camera:', error);
                alert('Camera access denied or not available.');
            },
            {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: false,
                correctOrientation: true,
                cameraDirection: useBackCamera ? Camera.Direction.BACK : Camera.Direction.FRONT
            }
        );
    }

    // Close the camera
    function closeCamera() {
        const videoElement = document.getElementById('video');
        videoElement.style.display = 'none';
    }

    // Switch camera between front and back
    window.switchCamera = async function() {
        useBackCamera = !useBackCamera; // Toggle the camera
        openCamera(); // Reopen the camera with the new facing mode
    };

    // Capture button functionality
    window.captureImage = function() {
        const canvas = document.getElementById('canvas');
        const video = document.getElementById('video');
        const context = canvas.getContext('2d');
        canvas.style.display = 'block';
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const capturedImage = document.getElementById('capturedImage');
        capturedImage.src = canvas.toDataURL('image/jpeg');
        capturedImage.style.display = 'block';

        alert('Image captured successfully');
    };

    // Remove button functionality
    window.removeImage = function() {
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        const capturedImage = document.getElementById('capturedImage');
        capturedImage.style.display = 'none'; // Hide the captured image

        alert('Image removed. You can retake the photo.');
    };
});
