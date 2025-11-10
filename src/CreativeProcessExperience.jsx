import React, { useEffect, useRef, useState } from "react";

// If you're using a bundler, make sure gsap + plugins and @studio-freight/lenis are installed.
// npm i gsap @studio-freight/lenis
import gsap from "gsap";
import { ScrollTrigger, CustomEase } from "gsap/all";

// Lenis for smooth scrolling
import Lenis from "@studio-freight/lenis";

export default function CreativeProcessExperience() {
  const rootRef = useRef(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, CustomEase);
    CustomEase.create("customEase", "M0,0 C0.86,0 0.07,1 1,1");

    const root = rootRef.current;
    if (!root) return;

    // ------- Sound Manager (vanilla, scoped)
    class SoundManager {
      constructor() {
        this.sounds = {};
        this.isEnabled = false;
        this.init();
      }
      init() {
        this.loadSound("hover", "https://assets.codepen.io/7558/click-reverb-001.mp3", 0.15);
        this.loadSound("click", "https://assets.codepen.io/7558/shutter-fx-001.mp3", 0.3);
        this.loadSound("textChange", "https://assets.codepen.io/7558/whoosh-fx-001.mp3", 0.3);
      }
      loadSound(name, url, volume = 0.3) {
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.volume = volume;
        this.sounds[name] = audio;
      }
      enableAudio() {
        this.isEnabled = true;
      }
      disableAudio() {
        this.isEnabled = false;
      }
      play(name, delay = 0) {
        if (!this.isEnabled || !this.sounds[name]) return;
        const a = this.sounds[name];
        const doPlay = () => {
          try {
            a.currentTime = 0;
            a.play();
          } catch (e) {
            // ignore
          }
        };
        if (delay > 0) setTimeout(doPlay, delay); else doPlay();
      }
    }

    const soundManager = new SoundManager();
    if (soundOn) soundManager.enableAudio(); else soundManager.disableAudio();

    // --------- Helpers
    const $ = (sel, ctx = root) => ctx.querySelector(sel);
    const $$ = (sel, ctx = root) => Array.from(ctx.querySelectorAll(sel));

    // Elements
    const loadingOverlay = $("#loading-overlay");
    const loadingCounter = $("#loading-counter");
    const debugInfo = $("#debug-info");
    const fixedContainer = $("#fixed-container");
    const fixedSectionElement = $(".fixed-section");
    const header = root.querySelector(".header");
    const content = root.querySelector(".content");
    const footer = $("#footer");
    const leftColumn = $("#left-column");
    const rightColumn = $("#right-column");
    const featured = $("#featured");
    const backgrounds = $$(".background-image");
    const artists = $$(".artist");
    const categories = $$(".category");
    const featuredContents = $$(".featured-content");
    const progressFill = $("#progress-fill");
    const currentSectionDisplay = $("#current-section");

    // Replace GSAP SplitText with manual word splitter
    const splitTexts = {};
    featuredContents.forEach((fc, idx) => {
      const h3 = fc.querySelector("h3");
      if (!h3) return;
      const words = h3.textContent.trim().split(/\s+/);
      h3.innerHTML = ""; // clear
      const wordSpans = [];
      words.forEach((w, i) => {
        const mask = document.createElement("span");
        mask.className = "word-mask";
        const span = document.createElement("span");
        span.className = "split-word";
        span.textContent = w + (i < words.length - 1 ? "\u00A0" : "");
        mask.appendChild(span);
        h3.appendChild(mask);
        wordSpans.push(span);
      });
      splitTexts[`featured-${idx}`] = { words: wordSpans };
      // initial states
      wordSpans.forEach((el) => {
        gsap.set(el, { yPercent: idx === 0 ? 0 : 100, opacity: idx === 0 ? 1 : 0 });
      });
    });

    // Loading counter animation
    let counter = 0;
    const counterInterval = setInterval(() => {
      counter += Math.random() * 3 + 1;
      if (counter >= 100) {
        counter = 100;
        clearInterval(counterInterval);
        setTimeout(() => {
          gsap.to(loadingOverlay.querySelector(".loading-counter"), {
            opacity: 0,
            y: -20,
            duration: 0.6,
            ease: "power2.inOut",
          });
          gsap.to(loadingOverlay.childNodes[0], {
            opacity: 0,
            y: -20,
            duration: 0.6,
            ease: "power2.inOut",
            onComplete: () => {
              gsap.to(loadingOverlay, {
                y: "-100%",
                duration: 1.2,
                ease: "power3.inOut",
                delay: 0.3,
                onComplete: () => {
                  loadingOverlay.style.display = "none";
                  animateColumns();
                },
              });
            },
          });
        }, 200);
      }
      if (loadingCounter) loadingCounter.textContent = `[${String(Math.floor(counter)).padStart(2, "0")}]`;
    }, 30);

    // Smooth scroll (Lenis)
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    function animateColumns() {
      const artistItems = $$(".artist");
      const categoryItems = $$(".category");
      artistItems.forEach((item, index) => setTimeout(() => item.classList.add("loaded"), index * 60));
      categoryItems.forEach((item, index) => setTimeout(() => item.classList.add("loaded"), index * 60 + 200));
    }

    function updateProgressNumbers(val) {
      if (currentSectionDisplay) currentSectionDisplay.textContent = String(val + 1).padStart(2, "0");
    }

    const fixedSectionTop = fixedSectionElement.offsetTop;
    const fixedSectionHeight = fixedSectionElement.offsetHeight;
    let currentSection = 0;
    let isAnimating = false;
    let isSnapping = false;
    let lastProgress = 0;
    let scrollDirection = 0;
    const sectionPositions = Array.from({ length: 10 }, (_, i) => fixedSectionTop + (fixedSectionHeight * i) / 10);

    function changeSection(newSection) {
      if (newSection === currentSection || isAnimating) return;
      isAnimating = true;
      const isDown = newSection > currentSection;
      const previousSection = currentSection;
      currentSection = newSection;

      updateProgressNumbers(currentSection);
      const sectionProgress = currentSection / 9;
      if (progressFill) progressFill.style.width = `${sectionProgress * 100}%`;
      if (debugInfo) debugInfo.textContent = `Changing to Section: ${newSection} (${isDown ? "Down" : "Up"})`;

      featuredContents.forEach((c, i) => {
        if (i !== newSection && i !== previousSection) {
          c.classList.remove("active");
          gsap.set(c, { visibility: "hidden", opacity: 0 });
        }
      });

      const prevWords = splitTexts[`featured-${previousSection}`]?.words;
      if (prevWords) {
        gsap.to(prevWords, {
          yPercent: isDown ? -100 : 100,
          opacity: 0,
          duration: 0.64 * 0.6,
          stagger: isDown ? 0.03 : -0.03,
          ease: "customEase",
          onComplete: () => {
            featuredContents[previousSection].classList.remove("active");
            gsap.set(featuredContents[previousSection], { visibility: "hidden" });
          },
        });
      }

      const newWords = splitTexts[`featured-${newSection}`]?.words;
      if (newWords) {
        soundManager.play("textChange", 250);
        featuredContents[newSection].classList.add("active");
        gsap.set(featuredContents[newSection], { visibility: "visible", opacity: 1 });
        gsap.set(newWords, { yPercent: isDown ? 100 : -100, opacity: 0 });
        gsap.to(newWords, { yPercent: 0, opacity: 1, duration: 0.64, stagger: isDown ? 0.05 : -0.05, ease: "customEase" });
      }

      const parallaxAmount = 5;
      backgrounds.forEach((bg, i) => {
        bg.classList.remove("previous", "active");
        if (i === newSection) {
          if (isDown) {
            gsap.set(bg, { opacity: 1, y: 0, clipPath: "inset(100% 0 0 0)" });
            gsap.to(bg, { clipPath: "inset(0% 0 0 0)", duration: 0.64, ease: "customEase" });
          } else {
            gsap.set(bg, { opacity: 1, y: 0, clipPath: "inset(0 0 100% 0)" });
            gsap.to(bg, { clipPath: "inset(0 0 0% 0)", duration: 0.64, ease: "customEase" });
          }
          bg.classList.add("active");
        } else if (i === previousSection) {
          bg.classList.add("previous");
          gsap.to(bg, { y: isDown ? `${parallaxAmount}%` : `-${parallaxAmount}%`, duration: 0.64, ease: "customEase" });
          gsap.to(bg, {
            opacity: 0,
            delay: 0.64 * 0.5,
            duration: 0.64 * 0.5,
            ease: "customEase",
            onComplete: () => {
              bg.classList.remove("previous");
              gsap.set(bg, { y: 0 });
              isAnimating = false;
            },
          });
        } else {
          gsap.to(bg, { opacity: 0, duration: 0.64 * 0.3, ease: "customEase" });
        }
      });

      artists.forEach((el, i) => {
        if (i === newSection) {
          el.classList.add("active");
          gsap.to(el, { opacity: 1, duration: 0.3, ease: "power2.out" });
        } else {
          el.classList.remove("active");
          gsap.to(el, { opacity: 0.3, duration: 0.3, ease: "power2.out" });
        }
      });
      categories.forEach((el, i) => {
        if (i === newSection) {
          el.classList.add("active");
          gsap.to(el, { opacity: 1, duration: 0.3, ease: "power2.out" });
        } else {
          el.classList.remove("active");
          gsap.to(el, { opacity: 0.3, duration: 0.3, ease: "power2.out" });
        }
      });
    }

    function navigateToSection(index) {
      if (isSnapping || index === currentSection) return;
      if (soundOn) soundManager.enableAudio();
      soundManager.play("click");
      isSnapping = true;
      changeSection(index);
      const target = sectionPositions[index];
      lenis.scrollTo(target, { duration: 0.8, easing: (t) => 1 - Math.pow(1 - t, 3), lock: true, onComplete: () => { isSnapping = false; } });
    }

    artists.forEach((el, i) => {
      el.addEventListener("click", (e) => { e.preventDefault(); navigateToSection(i); });
      el.addEventListener("mouseenter", () => { if (soundOn) soundManager.enableAudio(); soundManager.play("hover"); });
    });
    categories.forEach((el, i) => {
      el.addEventListener("click", (e) => { e.preventDefault(); navigateToSection(i); });
      el.addEventListener("mouseenter", () => { if (soundOn) soundManager.enableAudio(); soundManager.play("hover"); });
    });

    // Main pinned section
    gsap.set(fixedContainer, { height: "100vh" });

    ScrollTrigger.create({
      trigger: root.querySelector(".fixed-section"),
      start: "top top",
      end: "bottom bottom",
      pin: root.querySelector(".fixed-container"),
      pinSpacing: true,
      onUpdate: (self) => {
        if (isSnapping) return;
        const progress = self.progress;
        const delta = progress - lastProgress;
        if (Math.abs(delta) > 0.001) scrollDirection = delta > 0 ? 1 : -1;
        const targetSection = Math.min(9, Math.floor(progress * 10));
        if (targetSection !== 0 && targetSection !== undefined) { /* noop */ }
        if (targetSection !== currentSection && !isAnimating) {
          const next = currentSection + (targetSection > currentSection ? 1 : -1);
          // snap one section at a time
          isSnapping = true;
          changeSection(next);
          const target = sectionPositions[next];
          const lenisEasing = (t) => 1 - Math.pow(1 - t, 3);
          root.setAttribute("data-scroll-lock", "true");
          lenis.scrollTo(target, {
            duration: 0.6,
            easing: lenisEasing,
            lock: true,
            onComplete: () => {
              isSnapping = false;
              root.removeAttribute("data-scroll-lock");
            }
          });
        }
        lastProgress = progress;
        const sectionProgress = currentSection / 9;
        if (progressFill) progressFill.style.width = `${sectionProgress * 100}%`;
        if (debugInfo) debugInfo.textContent = `Section: ${currentSection}, Target: ${targetSection}, Progress: ${progress.toFixed(3)}, Direction: ${scrollDirection}`;
      },
    });

    // End section behaviour
    ScrollTrigger.create({
      trigger: root.querySelector(".end-section"),
      start: "top center",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (self.progress > 0.1) {
          footer.classList.add("blur");
          leftColumn.classList.add("blur");
          rightColumn.classList.add("blur");
          featured.classList.add("blur");
        } else {
          footer.classList.remove("blur");
          leftColumn.classList.remove("blur");
          rightColumn.classList.remove("blur");
          featured.classList.remove("blur");
        }
        if (self.progress > 0.1) {
          const newH = Math.max(0, 100 - ((self.progress - 0.1) / 0.9) * 100);
          gsap.to(fixedContainer, { height: `${newH}vh`, duration: 0.1, ease: "power1.out" });
          const moveY = (-(self.progress - 0.1) / 0.9) * 200;
          gsap.to(header, { y: moveY * 1.5, duration: 0.1, ease: "power1.out" });
          gsap.to(content, { y: `calc(${moveY}px + (-50%))`, duration: 0.1, ease: "power1.out" });
          gsap.to(footer, { y: moveY * 0.5, duration: 0.1, ease: "power1.out" });
        } else {
          gsap.to(fixedContainer, { height: "100vh", duration: 0.1, ease: "power1.out" });
          gsap.to(header, { y: 0, duration: 0.1, ease: "power1.out" });
          gsap.to(content, { y: "-50%", duration: 0.1, ease: "power1.out" });
          gsap.to(footer, { y: 0, duration: 0.1, ease: "power1.out" });
        }
        if (debugInfo) debugInfo.textContent = `End Section - Height: ${fixedContainer.style.height}, Progress: ${self.progress.toFixed(2)}`;
      },
    });

    // initial
    updateProgressNumbers(0);
    if (debugInfo) debugInfo.textContent = `Current Section: 0 (Initial)`;

    const keyHandler = (e) => {
      if (e.key.toLowerCase() === "h") {
        debugInfo.style.display = debugInfo.style.display === "none" ? "block" : "none";
      }
    };
    document.addEventListener("keydown", keyHandler);

    return () => {
      document.removeEventListener("keydown", keyHandler);
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [soundOn]);

  return (
    <div ref={rootRef} className="w-full min-h-screen bg-white font-sans">
      {/* Font + Base styles */}
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/pp-neue-montreal');
        :root { --font-primary: 'PP Neue Montreal', sans-serif; --text-color: rgba(245,245,245,0.9); }
        html, body { overflow-x: hidden; width: 100%; background-color: #fff; }
        body { font-family: var(--font-primary); color:#000; font-weight:500; letter-spacing:-0.02em; text-transform:uppercase; }
        .scroll-container{ position:relative; background:#fff; }
        .end-section{ font-size:2rem; height:100vh; position:relative; background:#fff; display:flex; align-items:center; justify-content:center; }
        .fin{ transform:rotate(90deg); position:sticky; top:50vh; color:#000; }
        .fixed-section{ height:1100vh; position:relative; background:#fff; }
        .fixed-container{ position:sticky; top:0; left:0; width:100%; height:100vh; overflow:hidden; will-change:transform,height; transform-origin:top center; background:#fff; }
        .grid-container{ display:grid; grid-template-columns:repeat(12,1fr); gap:1rem; padding:0 2rem; height:100%; position:relative; z-index:2; }
        .background-container{ position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; overflow:hidden; background:#000; }
        .background-image{ position:absolute; top:-10%; left:0; width:100%; height:120%; object-fit:cover; opacity:0; filter:brightness(0.8); will-change:transform; transform-origin:center center; }
        .background-image.active{ opacity:1; z-index:2; }
        .background-image.previous{ opacity:1; z-index:1; }
        .header{ grid-column:1/13; align-self:start; padding-top:5vh; font-size:10vw; line-height:.8; text-align:center; color:var(--text-color); will-change:transform,filter,opacity; }
        .header-row{ display:block; }
        .footer{ grid-column:1/13; align-self:end; padding-bottom:5vh; font-size:10vw; line-height:.8; text-align:center; color:var(--text-color); will-change:transform,filter,opacity; transition: filter .5s ease, opacity .5s ease; }
        .progress-indicator{ width:160px; height:1px; margin:2vh auto 0; position:relative; background:rgba(245,245,245,.3); }
        .progress-fill{ position:absolute; top:0; left:0; height:100%; width:0%; background:var(--text-color); transition: width .3s cubic-bezier(.65,0,.35,1); }
        .progress-numbers{ position:absolute; top:0; left:0; right:0; display:flex; justify-content:space-between; font-size:.7rem; color:var(--text-color); font-family:var(--font-primary); letter-spacing:-.02em; transform:translateY(-50%); margin:0 -25px; }
        .footer.blur, .left-column.blur, .right-column.blur{ filter:blur(8px); opacity:.3; transition:filter .8s ease, opacity .8s ease; }
        .content{ grid-column:1/13; display:flex; justify-content:space-between; align-items:center; width:100%; position:absolute; top:50%; left:0; transform:translateY(-50%); padding:0 2rem; will-change:transform; }
        .left-column, .right-column{ width:40%; display:flex; flex-direction:column; gap:.25rem; will-change:filter,opacity; transition:filter .5s ease, opacity .5s ease; }
        .left-column{ text-align:left; }
        .right-column{ text-align:right; }
        .featured{ width:20%; display:flex; justify-content:center; align-items:center; text-align:center; font-size:1.5vw; position:relative; height:10vh; overflow:hidden; will-change:filter,opacity; transition:filter .5s ease, opacity .5s ease; }
        .featured.blur{ filter:blur(8px); opacity:.3; transition:filter .8s ease, opacity .8s ease; }
        .featured-content{ position:absolute; top:0; left:0; width:100%; height:100%; display:flex; justify-content:center; align-items:center; opacity:0; visibility:hidden; }
        .featured-content.active{ opacity:1; visibility:visible; }
        .featured-content h3{ white-space:nowrap; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100%; margin:0; font-weight:500; color:var(--text-color); }
        .word-mask{ display:inline-block; overflow:hidden; vertical-align:middle; }
        .split-word{ display:inline-block; vertical-align:middle; }
        .artist, .category{ opacity:0; transform:translateY(20px); transition:all .5s cubic-bezier(.16,1,.3,1); color:var(--text-color); cursor:pointer; position:relative; }
        .artist{ padding-left:0; }
        .category{ padding-right:0; }
        .artist:hover, .category:hover{ opacity:1 !important; }
        .artist.loaded, .category.loaded{ opacity:.3; transform:translateY(0); }
        .artist.active{ opacity:1; transform:translateX(10px); padding-left:15px; }
        .artist.active::before{ content:''; position:absolute; left:0; top:50%; transform:translateY(-50%); width:4px; height:4px; background:var(--text-color); border-radius:50%; }
        .category.active{ opacity:1; transform:translateX(-10px); padding-right:15px; }
        .category.active::after{ content:''; position:absolute; right:0; top:50%; transform:translateY(-50%); width:4px; height:4px; background:var(--text-color); border-radius:50%; }
        .loading-overlay{ position:fixed; top:0; left:0; width:100%; height:100%; background:#fff; display:flex; justify-content:center; align-items:center; z-index:9999; color:#000; font-size:1.5rem; font-family:var(--font-primary); text-transform:uppercase; letter-spacing:-.02em; }
        .loading-counter{ margin-left:.5rem; }
        .debug-info{ position:fixed; bottom:10px; right:10px; background:rgba(255,255,255,.7); color:#000; padding:10px; font-size:12px; z-index:9000; font-family:monospace; display:none; }
        .sound-toggle{ position:fixed; top:20px; right:20px; width:40px; height:40px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:1000; transition:all .3s ease; backdrop-filter:blur(10px); }
        .sound-toggle:hover{ background:rgba(255,255,255,.15); border-color:rgba(255,255,255,.3); transform:scale(1.05); }
        .sound-toggle.disabled{ background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.1); }
        .sound-toggle.disabled:hover{ background:rgba(255,255,255,.08); }
        .sound-dots{ position:relative; width:4px; height:4px; }
        .sound-dot{ position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:4px; height:4px; background:#fff; border-radius:50%; opacity:1; }
        .sound-dot.animated{ animation:expandDot 2s ease-out infinite; }
        .sound-dot.animated:nth-child(2){ animation-delay:.5s; }
        .sound-dot.animated:nth-child(3){ animation-delay:1s; }
        .sound-dot.animated:nth-child(4){ animation-delay:1.5s; }
        @keyframes expandDot { 0%{ width:4px; height:4px; opacity:1; } 100%{ width:20px; height:20px; opacity:0; } }
        .sound-toggle.disabled .sound-dot.animated{ animation:none; width:4px; height:4px; opacity:.3; }
        @media (max-width:768px){
          .content{ flex-direction:column; gap:5vh; }
          .left-column, .right-column, .featured{ width:100%; text-align:center; }
          .featured{ font-size:3vw; order:-1; margin-bottom:2vh; }
          .header, .footer{ font-size:15vw; }
          .progress-indicator{ width:120px; }
        }
      `}</style>

      {/* Sound toggle */}
      <button
        className={`sound-toggle ${soundOn ? "" : "disabled"}`}
        aria-label="Toggle sound"
        onClick={() => setSoundOn((v) => !v)}
      >
        <div className="sound-dots">
          <span className="sound-dot animated" />
          <span className="sound-dot animated" />
          <span className="sound-dot animated" />
          <span className="sound-dot animated" />
        </div>
      </button>

      {/* Loading overlay */}
      <div className="loading-overlay" id="loading-overlay">
        Loading <span className="loading-counter" id="loading-counter">[00]</span>
      </div>

      {/* Debug helper (toggle with "h") */}
      <div className="debug-info" id="debug-info">Current Section: 0</div>

      <div className="scroll-container" id="scroll-container">
        <div className="fixed-section" id="fixed-section">
          <div className="fixed-container" id="fixed-container">
            <div className="background-container" id="background-container">
              {Array.from({ length: 10 }).map((_, i) => (
                <img
                  key={i}
                  src={`https://assets.codepen.io/7558/flame-glow-blur-${String(i + 1).padStart(3, "0")}.jpg`}
                  alt={`Background ${i + 1}`}
                  className={`background-image ${i === 0 ? "active" : ""}`}
                  id={`background-${i + 1}`}
                />
              ))}
            </div>

            <div className="grid-container">
              <div className="header">
                <div className="header-row">The Creative</div>
                <div className="header-row">Process</div>
              </div>

              <div className="content">
                <div className="left-column" id="left-column">
                  {[
                    "Silence","Meditation","Intuition","Authenticity","Presence","Listening","Curiosity","Patience","Surrender","Simplicity",
                  ].map((label, i) => (
                    <div key={i} className={`artist ${i === 0 ? "active" : ""}`} id={`artist-${i}`} data-index={i}>
                      {label}
                    </div>
                  ))}
                </div>

                <div className="featured" id="featured">
                  {[
                    "Creative Elements","Inner Stillness","Deep Knowing","True Expression","Now Moment","Deep Attention","Open Exploration","Calm Waiting","Let Go Control","Pure Essence",
                  ].map((title, i) => (
                    <div key={i} className={`featured-content ${i === 0 ? "active" : ""}`} id={`featured-${i}`} data-index={i}>
                      <h3>{title}</h3>
                    </div>
                  ))}
                </div>

                <div className="right-column" id="right-column">
                  {[
                    "Reduction","Essence","Space","Resonance","Truth","Feeling","Clarity","Emptiness","Awareness","Minimalism",
                  ].map((label, i) => (
                    <div key={i} className={`category ${i === 0 ? "active" : ""}`} id={`category-${i}`} data-index={i}>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="footer" id="footer">
                <div className="header-row">Beyond</div>
                <div className="header-row">Thinking</div>
                <div className="progress-indicator">
                  <div className="progress-numbers">
                    <span id="current-section">01</span>
                    <span id="total-sections">10</span>
                  </div>
                  <div className="progress-fill" id="progress-fill" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="end-section">
          <p className="fin">fin</p>
        </div>
      </div>
    </div>
  );
}
