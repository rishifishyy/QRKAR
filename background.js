(() => {
    const field = document.getElementById("particles");
    const glow = document.getElementById("cursor-glow");
    if (!field || !glow) return;
    for (let index = 0; index < 36; index++) {
        const particle = document.createElement("span");
        particle.className = "particle";
        const values = {
            "--x": `${(index * 37 + 13) % 100}%`,
            "--y": `${(index * 61 + 7) % 100}%`,
            "--size": `${index % 4 === 0 ? 4 : 2}px`,
            "--duration": `${6 + index % 7}s`,
            "--delay": `${-index * 1.7}s`,
            "--drift-x": `${(index % 2 ? 1 : -1) * (40 + index % 55)}px`
        };
        for (const [key, value] of Object.entries(values)) particle.style.setProperty(key, value);
        field.appendChild(particle);
    }
    let motionEnabled = true;
    try { motionEnabled = localStorage.getItem('qrkar-motion') !== 'off'; } catch {}
    const motionToggle = document.getElementById('motion-toggle');
    function updateMotion() {
        document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off';
        motionToggle.textContent = motionEnabled ? 'Motion on' : 'Motion off';
        motionToggle.setAttribute('aria-pressed', String(motionEnabled));
    }
    updateMotion();
    let frame = 0, pointerX = 0, pointerY = 0;
    window.addEventListener("pointermove", event => {
        if (!motionEnabled || event.pointerType === "touch") return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (frame) return;
        frame = requestAnimationFrame(() => {
            glow.style.transform = `translate3d(${pointerX - 340}px, ${pointerY - 340}px, 0)`;
            frame = 0;
        });
    }, {
        passive: true
    });
    const pause = () => document.body.classList.toggle("background-paused", document.hidden);
    document.addEventListener("visibilitychange", pause);
    pause();
    const canvas = document.getElementById("flow");
    const context = canvas?.getContext("2d");
    if (!context) return;
    let width = 0, height = 0, tick = 0, animationFrame = 0, lastTime = 0;
    const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        paint();
    };
    function paint() {
        context.clearRect(0, 0, width, height);
        const light = document.documentElement.dataset.theme === "light";
        for (let band = 0; band < 2; band++) {
            for (let line = 0; line < 9; line++) {
                const gradient = context.createLinearGradient(0, 0, width, 0);
                const color = light ? "28,120,100" : "130,235,188";
                gradient.addColorStop(0, `rgba(${color},0)`);
                gradient.addColorStop(.3, `rgba(${color},${light ? .14 : .18})`);
                gradient.addColorStop(.75, `rgba(${color},${light ? .32 : .38})`);
                gradient.addColorStop(1, `rgba(${color},0)`);
                context.strokeStyle = gradient;
                context.lineWidth = line === 4 ? 1.6 : .7;
                context.beginPath();
                for (let x = -20; x <= width + 20; x += 8) {
                    const y = height * (band ? .88 : .23) + Math.sin(x / (width * .24) + tick + band * 2) * 52 + Math.sin(x / (width * .48) - tick * .8) * 30 + line * 10;
                    if (x === -20) context.moveTo(x, y); else context.lineTo(x, y);
                }
                context.stroke();
            }
        }
    }
    function animate(time) {
        animationFrame = 0;
        if (document.hidden || !motionEnabled) {
            paint();
            return;
        }
        if (time - lastTime >= 32) {
            tick += Math.min((time - lastTime) / 1e3, .05) * .8;
            lastTime = time;
            paint();
        }
        animationFrame = requestAnimationFrame(animate);
    }
    function resume() {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        lastTime = performance.now();
        paint();
        if (!document.hidden && motionEnabled) animationFrame = requestAnimationFrame(animate);
    }
    window.addEventListener("resize", resize, {
        passive: true
    });
    document.addEventListener("visibilitychange", resume);
    motionToggle.addEventListener('click', () => {
        motionEnabled = !motionEnabled;
        updateMotion();
        try {localStorage.setItem('qrkar-motion', motionEnabled ? 'on' : 'off');} catch {}
        resume();
    });
    new MutationObserver(paint).observe(document.documentElement, {
        attributes: true,
        attributeFilter: [ "data-theme" ]
    });
    resize();
    resume();
})();
