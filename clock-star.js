document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('star-canvas');
    const ctx = canvas.getContext('2d');

    const pointsSlider = document.getElementById('points');
    const pointsValue = document.getElementById('points-value');
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speed-value');
    const startStopButton = document.getElementById('start-stop');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    let numPoints = parseInt(pointsSlider.value, 10);
    let speed = parseInt(speedSlider.value, 10);
    let isRunning = false;
    let currentPoint = 0;
    let nextPoint = 1; // Start with a defined next point
    let animationFrameId;
    let lastUpdateTime = 0;
    // Speed calculation using a logarithmic scale for a more natural feel
    const minInterval = 4000; // Slowest speed (ms per transition)
    const maxInterval = 250;  // Fastest speed (ms per transition)

    function calculateInterval(sliderValue) {
        const minSlider = parseInt(speedSlider.min, 10);
        const maxSlider = parseInt(speedSlider.max, 10);

        const logMin = Math.log(minInterval);
        const logMax = Math.log(maxInterval);

        const scale = (logMax - logMin) / (maxSlider - minSlider);

        return Math.exp(logMin + scale * (sliderValue - minSlider));
    }

    let interval = calculateInterval(speed);

    // Attractor properties
    let attractor = { x: 0, y: 0, progress: 0 };

    function getPointCoordinates(index, centerX, centerY, radius) {
        const angle = (index / numPoints) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return { x, y };
    }

    function resizeCanvas() {
        const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
        canvas.width = size;
        canvas.height = size;
        draw();
    }

    function drawStar(centerX, centerY, radius) {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            points.push(getPointCoordinates(i, centerX, centerY, radius));
        }

        ctx.strokeStyle = document.body.classList.contains('dark-mode') ? '#666' : '#ccc'; // Lighter color for the star lines
        ctx.lineWidth = 0.5;

        for (let i = 0; i < numPoints; i++) {
            for (let j = i + 1; j < numPoints; j++) {
                if (i !== j) {
                    ctx.beginPath();
                    ctx.moveTo(points[i].x, points[i].y);
                    ctx.lineTo(points[j].x, points[j].y);
                    ctx.stroke();
                }
            }
        }

        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < numPoints; i++) {
            const textRadius = radius * 1.15;
            const { x, y } = getPointCoordinates(i, centerX, centerY, textRadius);
            
            // Highlight the next point
            if (isRunning && i === nextPoint) {
                ctx.fillStyle = 'red';
                ctx.font = 'bold 24px Arial';
            } else {
                ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#f0f0f0' : '#000';
                ctx.font = '20px Arial';
            }
            ctx.fillText(i + 1, x, y);
        }
    }

    function draw() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawStar(centerX, centerY, radius);
        drawAttractor(centerX, centerY, radius);
    }

    function drawAttractor(centerX, centerY, radius) {
        if (!isRunning) return;

        const startCoords = getPointCoordinates(currentPoint, centerX, centerY, radius);
        const endCoords = getPointCoordinates(nextPoint, centerX, centerY, radius);

        // Linear interpolation
        attractor.x = startCoords.x + (endCoords.x - startCoords.x) * attractor.progress;
        attractor.y = startCoords.y + (endCoords.y - startCoords.y) * attractor.progress;

        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(attractor.x, attractor.y, 10, 0, 2 * Math.PI);
        ctx.fill();
    }

    function animate(timestamp) {
        if (!isRunning) return;

        if (!lastUpdateTime) {
            lastUpdateTime = timestamp;
        }
        const deltaTime = timestamp - lastUpdateTime;
        lastUpdateTime = timestamp;

        // Update attractor progress
        const progressIncrement = (deltaTime / interval);
        attractor.progress += progressIncrement;

        if (attractor.progress >= 1) {
            attractor.progress %= 1; // Carry over excess progress
            currentPoint = nextPoint;
            
            // Pick a new random next point, different from the current one
            let newNextPoint;
            do {
                newNextPoint = Math.floor(Math.random() * numPoints);
            } while (newNextPoint === currentPoint);
            nextPoint = newNextPoint;
        }

        draw();
        animationFrameId = requestAnimationFrame(animate);
    }

    function start() {
        isRunning = true;
        startStopButton.textContent = 'Stop';
        pointsSlider.disabled = true;
        lastUpdateTime = 0;
        attractor.progress = 0;

        // Set initial points
        currentPoint = 0;
        nextPoint = Math.floor(Math.random() * (numPoints - 1)) + 1;

        animationFrameId = requestAnimationFrame(animate);
    }

    function stop() {
        isRunning = false;
        startStopButton.textContent = 'Start';
        pointsSlider.disabled = false;
        cancelAnimationFrame(animationFrameId);
        draw(); // Redraw to remove attractor and highlights
    }

    startStopButton.addEventListener('click', () => {
        if (isRunning) {
            stop();
        } else {
            start();
        }
    });

    pointsSlider.addEventListener('input', (e) => {
        numPoints = parseInt(e.target.value, 10);
        pointsValue.textContent = numPoints;
        draw();
    });

    speedSlider.addEventListener('input', (e) => {
        speed = parseInt(e.target.value, 10);
        speedValue.textContent = speed;
        interval = calculateInterval(speed);
    });

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        draw();
    });

    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
});