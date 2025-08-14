class MixedMediaSlider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.currentIndex = 0;
    }

    static get observedAttributes() {
        return ['slides-visible'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'slides-visible' && oldValue !== newValue) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
        this.cacheElements();
        this.addEventListeners();
        this.checkVisibleVideos();
    }

    getSlidesVisible() {
        return parseInt(this.getAttribute('slides-visible') || '3', 10);
    }

    cacheElements() {
        this.track = this.shadowRoot.querySelector('.mms-track');
        this.slides = Array.from(this.shadowRoot.querySelectorAll('.mms-slide'));
        this.prevBtn = this.shadowRoot.querySelector('.mms-prev');
        this.nextBtn = this.shadowRoot.querySelector('.mms-next');
    }

    addEventListeners() {
        this.prevBtn.addEventListener('click', () => this.scroll(-1));
        this.nextBtn.addEventListener('click', () => this.scroll(1));
        this.shadowRoot.addEventListener('transitionend', () => this.checkVisibleVideos());
        window.addEventListener('resize', () => this.checkVisibleVideos());
    }

    scroll(direction) {
        const visible = this.getSlidesVisible();
        const maxIndex = this.slides.length - visible;
        this.currentIndex = Math.max(0, Math.min(this.currentIndex + direction, maxIndex));
        this.updateTrackPosition();
    }

    updateTrackPosition() {
        const slideWidth = this.slides[0].offsetWidth;
        const offset = -(slideWidth * this.currentIndex);
        this.track.style.transform = `translateX(${offset}px)`;
    }

    checkVisibleVideos() {
        const visible = this.getSlidesVisible();
        this.slides.forEach((slide, index) => {
            const video = slide.querySelector('video');
            if (video) {
                if (index >= this.currentIndex && index < this.currentIndex + visible) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            }
        });
    }

    buildSlides() {
        let html = '';
        let index = 1;

        while (this.hasAttribute(`slide${index}`)) {
            const url = this.getAttribute(`slide${index}`);
            const type = (this.getAttribute(`slide${index}-type`) || 'image').toLowerCase();

            html += `<div class="mms-slide">`;

            if (type === 'image') {
                html += `<img src="${url}" alt="Slide ${index}">`;
            } else if (type === 'video') {
                html += `<video src="${url}" muted playsinline></video>`;
            } else if (type === 'iframe') {
                html += `<iframe src="${url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            }

            html += `</div>`;
            index++;
        }

        return html;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    overflow: hidden;
                }
                .mms-slider {
                    position: relative;
                    width: 100%;
                }
                .mms-track {
                    display: flex;
                    transition: transform 0.4s ease;
                    will-change: transform;
                }
                .mms-slide {
                    flex: 0 0 calc(100% / ${this.getSlidesVisible()});
                    box-sizing: border-box;
                    padding: 0.5rem;
                }
                .mms-slide img,
                .mms-slide video,
                .mms-slide iframe {
                    width: 100%;
                    height: auto;
                    display: block;
                }
                .mms-prev,
                .mms-next {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background-color: rgba(0,0,0,0.5);
                    color: white;
                    border: none;
                    font-size: 2rem;
                    padding: 0.25rem 0.5rem;
                    cursor: pointer;
                    z-index: 2;
                }
                .mms-prev { left: 5px; }
                .mms-next { right: 5px; }
            </style>

            <div class="mms-slider">
                <div class="mms-track">
                    ${this.buildSlides()}
                </div>
                <button class="mms-prev">&#10094;</button>
                <button class="mms-next">&#10095;</button>
            </div>
        `;
    }
}

customElements.define('mixed-media-slider', MixedMediaSlider);