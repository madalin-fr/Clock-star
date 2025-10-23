const App = {
        // STATE: Centralized application state
        state: {
            numPoints: 16,
            speed: 25,
            isRunning: false,
            isDarkMode: false,
            attractorColor: 'blue',
            uiVisible: true,
            uiTimeout: null,
            highlightNextPoint: true,
        },

        // CACHE: DOM element references
        cache: {},

        // INITIALIZATION
        init() {
            this.cacheElements();
            this.bindEvents();
            this.resizeCanvas();
            this.updateUI();
            this.showUITemporarily();
        },

        cacheElements() {
            this.cache.canvas = document.getElementById('star-canvas');
            this.cache.ctx = this.cache.canvas.getContext('2d');
            this.cache.uiContainer = document.getElementById('ui-container');
            this.cache.pointsSlider = document.getElementById('points');
            this.cache.pointsValue = document.getElementById('points-value');
            this.cache.speedSlider = document.getElementById('speed');
            this.cache.speedValue = document.getElementById('speed-value');
            this.cache.startStopButton = document.getElementById('start-stop');
            this.cache.darkModeToggle = document.getElementById('dark-mode-toggle');
            this.cache.colorToggle = document.getElementById('color-toggle');
            this.cache.highlightToggle = document.getElementById('highlight-toggle');
            this.cache.fullscreenButton = document.getElementById('fullscreen-button');
        },

        bindEvents() {
            window.addEventListener('resize', () => this.resizeCanvas());
            document.addEventListener('mousemove', () => this.showUITemporarily());

            this.cache.pointsSlider.addEventListener('input', e => this.updateState({ numPoints: parseInt(e.target.value, 10) }));
            this.cache.speedSlider.addEventListener('input', e => this.updateState({ speed: parseInt(e.target.value, 10) }));

            this.cache.uiContainer.addEventListener('click', e => {
                setTimeout(() => {
                    const target = e.target;
                    const button = target.closest('button');
                    const toggle = target.closest('.toggle-container');

                    if (button) {
                        switch (button.id) {
                            case 'fullscreen-button':
                                this.toggleFullscreen();
                                break;
                        }
                    } else if (toggle) {
                        switch (toggle.id) {
                            case 'dark-mode-toggle':
                                this.toggleDarkMode();
                                break;
                        }
                    }
                }, 0);
            });
        },

        // STATE MANAGEMENT
        updateState(newState) {
            Object.assign(this.state, newState);
            this.updateUI();
            this.draw();
        },

        // UI LOGIC
        updateUI() {
            // Sliders and values
            this.cache.pointsSlider.value = this.state.numPoints;
            this.cache.pointsValue.textContent = this.state.numPoints;
            this.cache.speedSlider.value = this.state.speed;
            this.cache.speedValue.textContent = this.state.speed;
            const isRunning = this.state.isRunning;
            this.cache.pointsSlider.disabled = isRunning;
            this.cache.speedSlider.disabled = isRunning;
            this.cache.darkModeToggle.style.pointerEvents = isRunning ? 'none' : 'auto';


            // Start/Stop button
            this.cache.startStopButton.textContent = isRunning ? 'Stop' : 'Start';

            // Dark mode
            document.body.classList.toggle('dark-mode', this.state.isDarkMode);

            // UI Visibility
            document.body.classList.toggle('ui-visible', this.state.uiVisible);
        },

        showUITemporarily() {
            if (!this.state.uiVisible) {
                this.updateState({ uiVisible: true });
            }
            clearTimeout(this.state.uiTimeout);
            this.state.uiTimeout = setTimeout(() => this.updateState({ uiVisible: false }), 3000);
        },

        toggleDarkMode() {
            this.updateState({ isDarkMode: !this.state.isDarkMode });
        },
        
        cycleAttractorColor() {
            const colors = ['#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#e74c3c'];
            const currentIndex = colors.indexOf(this.state.attractorColor);
            const nextColor = colors[(currentIndex + 1) % colors.length];
            this.updateState({ attractorColor: nextColor });
        },

        toggleFullscreen() {
            if (screenfull.isEnabled) {
                screenfull.toggle();
            }
        },

        toggleHighlight() {
            this.updateState({ highlightNextPoint: !this.state.highlightNextPoint });
        },

        // UTILITIES
        nextTick(callback) {
            requestAnimationFrame(() => requestAnimationFrame(callback));
        },

        // CANVAS & DRAWING
        resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            this.cache.canvas.width = window.innerWidth * dpr;
            this.cache.canvas.height = window.innerHeight * dpr;
            this.cache.ctx.scale(dpr, dpr);
            this.draw();
        },

        getPointCoordinates(index, centerX, centerY, radius) {
            const angle = (index / this.state.numPoints) * 2 * Math.PI - Math.PI / 2;
            return {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
            };
        },

        draw() {
            const { ctx, canvas } = this.cache;
            const { numPoints, isRunning, isDarkMode } = this.state;
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) * 0.4;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw star lines
            ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            const points = Array.from({ length: numPoints }, (_, i) => this.getPointCoordinates(i, centerX, centerY, radius));
            for (let i = 0; i < numPoints; i++) {
                for (let j = i + 1; j < numPoints; j++) {
                    ctx.beginPath();
                    ctx.moveTo(points[i].x, points[i].y);
                    ctx.lineTo(points[j].x, points[j].y);
                    ctx.stroke();
                }
            }

            // Draw points and numbers
            for (let i = 0; i < numPoints; i++) {
                const textRadius = radius * 1.15;
                const { x, y } = this.getPointCoordinates(i, centerX, centerY, textRadius);
                
                if (this.state.highlightNextPoint && isRunning && this.animation && i === this.animation.nextPoint) {
                    ctx.fillStyle = 'red';
                    ctx.font = 'bold 20px Arial';
                } else {
                    ctx.fillStyle = isDarkMode ? '#f0f0f0' : '#000';
                    ctx.font = '16px Arial';
                }

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(i + 1, x, y);
            }
            
            // Draw attractor if running
            if (this.animation && this.animation.attractor) {
                this.drawAttractor(this.animation.attractor);
            }
        },
        
        drawAttractor(attractor) {
            const { ctx } = this.cache;
            ctx.fillStyle = this.state.attractorColor;
            ctx.beginPath();
            ctx.arc(attractor.x, attractor.y, 10, 0, 2 * Math.PI);
            ctx.fill();
        },

        // ANIMATION
        toggleAnimation() {
            const wasRunning = this.state.isRunning;
            this.updateState({ isRunning: !wasRunning });
    
            this.nextTick(() => {
                if (!wasRunning) {
                    this.startAnimation();
                } else {
                    this.stopAnimation();
                }
            });
        },

        startAnimation() {
            const { numPoints } = this.state;
            this.animation = {
                currentPoint: 0,
                nextPoint: Math.floor(Math.random() * (numPoints - 1)) + 1,
                attractor: { x: 0, y: 0 },
                timeline: gsap.timeline({ repeat: -1, onRepeat: () => this.chooseNextPoint() })
            };
            this.moveAttractor();
        },
        
        stopAnimation() {
            if (this.animation && this.animation.timeline) {
                this.animation.timeline.kill();
                this.animation = null;
            }
            this.draw(); // Redraw to remove attractor
        },

        chooseNextPoint() {
            if (!this.animation) return;
            let newNextPoint;
            do {
                newNextPoint = Math.floor(Math.random() * this.state.numPoints);
            } while (newNextPoint === this.animation.currentPoint);
            this.animation.currentPoint = this.animation.nextPoint;
            this.animation.nextPoint = newNextPoint;
            this.moveAttractor();
        },

        moveAttractor() {
            const { canvas } = this.cache;
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) * 0.4;

            const startCoords = this.getPointCoordinates(this.animation.currentPoint, centerX, centerY, radius);
            const endCoords = this.getPointCoordinates(this.animation.nextPoint, centerX, centerY, radius);
            
            const speedFactor = 101 - this.state.speed; // Inverse relationship
            const duration = (speedFactor / 100) * 4; // Scale to a reasonable duration range

            this.animation.attractor.x = startCoords.x;
            this.animation.attractor.y = startCoords.y;

            this.animation.timeline.clear().to(this.animation.attractor, {
                x: endCoords.x,
                y: endCoords.y,
                duration: duration,
                ease: "power1.inOut",
                onUpdate: () => this.draw()
            });
        }
    };

    App.init();