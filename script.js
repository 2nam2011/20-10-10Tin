(function () {
  "use strict";

  // ---------- SVG path animation ----------
  const SVG_NS = "http://www.w3.org/2000/svg";
  const theSvg = document.getElementById("theSvg");
  const shape = document.getElementById("shape");
  const partialPath = document.getElementById("partialPath");
  let flowerFrame = null;
  let flowerFinished = false;

  // Draw the decorative SVG path behind the flower.
  function initPathAnimation() {
    if (!shape || !partialPath) return;

    const pathLength = shape.getTotalLength();
    let t = 0;
    let lastIndex = 0;
    const d = shape.getAttribute("d") || "";

    function lerp(a, b, value) {
      return [(b[0] - a[0]) * value + a[0], (b[1] - a[1]) * value + a[1]];
    }

    function getBezierPoints(value, points) {
      const h = [];
      for (let i = 1; i < 4; i++) h.push(lerp(points[i - 1], points[i], value));
      h.push(lerp(h[0], h[1], value));
      h.push(lerp(h[1], h[2], value));
      h.push(lerp(h[3], h[4], value));
      return [points[0], h[0], h[3], h[5]];
    }

    function parseNumbers(value) {
      return value
        .split(/[A-Z,a-z\s,]/)
        .filter(Boolean)
        .map(Number);
    }

    class SubPath {
      constructor(value, previous) {
        this.d = value;
        this.previous = previous || null;
        this.points = parseNumbers(value);
        this.pathLength = this.measurePath();
        this.mPoint = this.getMPoint();
        this.lastCubicBezier = this.getLastCubicBezier();
      }

      measurePath() {
        const p = document.createElementNS(SVG_NS, "path");
        p.setAttribute("d", this.d);
        return p.getTotalLength();
      }

      getMPoint() {
        // Đoạn đầu tiên: điểm bắt đầu là toạ độ của lệnh M (2 số đầu).
        // Các đoạn sau: điểm bắt đầu là điểm cuối của đoạn trước.
        if (!this.previous) return [this.points[0], this.points[1]];
        const p = this.previous.points;
        return [p[p.length - 2], p[p.length - 1]];
      }

      getLastCubicBezier() {
        const lastC = this.d.lastIndexOf("C");
        // Tách theo mọi chữ cái/khoảng trắng/dấu phẩy để "21.054z" không thành NaN.
        const nums = parseNumbers(this.d.substring(lastC + 1));
        const result = [this.mPoint];
        for (let i = 0; i < nums.length; i += 2) {
          result.push(nums.slice(i, i + 2));
        }
        return result;
      }
    }

    const subpaths = [];
    const count = (d.match(/C/gi) || []).length;
    let pos = 0;

    for (let i = 0; i < count; i++) {
      const next = d.indexOf("C", pos + 1);
      if (i > 0)
        subpaths.push(
          new SubPath(d.substring(0, next), subpaths[subpaths.length - 1]),
        );
      pos = next;
    }
    if (d) subpaths.push(new SubPath(d, subpaths[subpaths.length - 1]));

    if (!subpaths.length) return;

    function findIndex(length) {
      for (let i = 0; i < subpaths.length; i++) {
        if (subpaths[i].pathLength >= length) return i;
      }
      return subpaths.length - 1;
    }

    function draw(value) {
      const lengthAtT = pathLength * value;
      const index = findIndex(lengthAtT);
      const current = subpaths[index];
      let T;

      if (index > 0) {
        T =
          (lengthAtT - current.previous.pathLength) /
          (current.pathLength - current.previous.pathLength);
      } else {
        T = lengthAtT / current.pathLength;
      }

      T = Math.max(0, Math.min(1, T));
      const points = getBezierPoints(T, current.lastCubicBezier);
      let pathD =
        index > 0 ? current.previous.d : `M${points[0][0]},${points[0][1]} C`;

      for (let i = 1; i < 4; i++) {
        pathD += ` ${points[i][0]},${points[i][1]} `;
      }
      partialPath.setAttribute("d", pathD);
    }

    draw(0);

    function typingPath(timestamp) {
      if (!typingPath.start) typingPath.start = timestamp;
      t = Math.min(1, (timestamp - typingPath.start) / 4000);
      // ease-in-out cubic
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      draw(eased);

      if (t < 1) {
        flowerFrame = requestAnimationFrame(typingPath);
      } else {
        flowerFrame = null;
      }
    }

    // Keep the original text/path animation available when the user clicks the flower.
    window.startDecorativePath = function () {
      if (flowerFrame) cancelAnimationFrame(flowerFrame);
      typingPath.start = null;
      flowerFrame = requestAnimationFrame(typingPath);
    };
  }

  // ---------- Rose animation ----------
  function animateRose() {
    const parts = [
      document.querySelector(".leafOne"),
      document.querySelector(".stickLine"),
      document.querySelector(".leafTwo"),
      document.querySelector(".leafS1"),
      document.querySelector(".rose1"),
      document.querySelector(".rose2"),
      document.querySelector(".rose3"),
      document.querySelector(".rose4"),
    ].filter(Boolean);

    const finalFills = [
      "#9CDD05",
      "#83AA2E",
      "#9CDD05",
      "#9CDD05",
      "#F37D79",
      "#D86666",
      "#F37D79",
      "#D86666",
    ];

    parts.forEach((part, i) => {
      const length = part.getTotalLength();
      part.style.fill = "none";
      part.style.stroke = "black";
      part.style.strokeDasharray = `${length}`;
      part.style.strokeDashoffset = `${length}`;
      part.style.strokeLinecap = "round";
      part.style.strokeLinejoin = "round";

      // Small stagger makes the drawing feel natural without Anime.js.
      part.dataset.length = length;
      part.dataset.delay = i * 80;
    });

    const start = performance.now();
    const duration = 4000;

    function frame(now) {
      const elapsed = now - start;
      let allDone = true;

      parts.forEach((part, i) => {
        const delay = Number(part.dataset.delay);
        const progress = Math.max(0, Math.min(1, (elapsed - delay) / duration));
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        const length = Number(part.dataset.length);
        part.style.strokeDashoffset = String(length * (1 - eased));

        if (progress < 1) allDone = false;
      });

      if (!allDone) {
        requestAnimationFrame(frame);
      } else {
        parts.forEach((part, i) => {
          part.style.strokeDasharray = "none";
          part.style.strokeDashoffset = "0";
          part.style.stroke = "none";
          part.style.fill = finalFills[i] || "#F37D79";
        });
        flowerFinished = true;
      }
    }

    requestAnimationFrame(frame);
  }

  // ---------- Magic dust ----------
  function createMagicDust(
    x1,
    x2,
    y1,
    y2,
    sizeRatio,
    fallingTime,
    animationDelay,
    node,
  ) {
    const dust = document.createElement("span");
    const id = `blink${createMagicDust.id++}`;
    const target = document.getElementById(node) || document.body;
    const style = document.createElement("style");

    style.textContent = `
            @keyframes ${id} {
                0% { top:${y1}px; left:${x1}px; width:${2 * sizeRatio}px; height:${2 * sizeRatio}px; opacity:.4; }
                20% { width:${4 * sizeRatio}px; height:${4 * sizeRatio}px; opacity:.8; }
                35% { width:${2 * sizeRatio}px; height:${2 * sizeRatio}px; opacity:.5; }
                55% { width:${3 * sizeRatio}px; height:${3 * sizeRatio}px; opacity:.7; }
                80% { width:${sizeRatio}px; height:${sizeRatio}px; opacity:.3; }
                100% { top:${y2}px; left:${x2}px; width:0; height:0; opacity:.1; }
            }
        `;
    document.head.appendChild(style);
    dust.className = "dustDef";
    dust.style.animation = `${id} ${fallingTime}s cubic-bezier(.71,.11,.68,.83) infinite ${animationDelay}s`;
    target.appendChild(dust);
  }
  createMagicDust.id = 1;

  function initMagicDust() {
    [
      [130, 132, 150, 152, 0.15, 2.5, 0.1, "sub"],
      [65, 63, 300, 299, 0.5, 2, 0.2, "sub"],
      [70, 70, 150, 150, 0.45, 2, 0.5],
      [75, 78, 160, 170, 0.6, 2, 1],
      [80, 82, 160, 180, 0.6, 1, 0.4],
      [85, 100, 160, 170, 0.5, 2, 0.5],
      [125, 110, 170, 180, 0.25, 3, 1.5],
      [90, 90, 115, 115, 0.4, 2, 2],
      [93, 95, 200, 200, 0.4, 3, 1.5],
      [100, 100, 145, 155, 0.45, 1, 0.5],
      [100, 90, 170, 230, 0.35, 2, 0.75],
      [100, 102, 115, 112, 0.35, 3, 0.25],
      [100, 95, 170, 200, 0.55, 1.5, 0.75],
      [100, 97, 150, 190, 0.7, 2, 1.5],
      [105, 100, 160, 180, 0.5, 1.5, 0.725],
      [125, 125, 180, 190, 0.25, 1, 0.725],
      [130, 130, 135, 135, 0.45, 3, 1.5],
      [135, 132, 170, 190, 0.25, 2.5, 0.75],
      [135, 132, 320, 315, 0.2, 5, 0.3, "sub"],
    ].forEach((item) => createMagicDust(...item));
  }

  // ---------- Letter typing ----------
  const titleText = "Gửi 3 nàng công chúa của lớp 10 Tin";
  const bodyText =
    "Hôm nay là ngày 20/10, là ngày Quốc tế Phụ nữ. Chúc các bạn nữ lớp mình luôn hạnh phúc, vui vẻ, xinh đẹp và học giỏi. Nhờ sự có mặt của các bạn trong lớp đã mang lại một nét mềm mại cho tập thể lớp 10 Tin. Vì vậy nhân ngày này, các bạn nam gửi tặng cho các bạn một món quà nhỏ coi như lời cảm ơn, mong các bạn sẽ thích nó và trân trọng nó. Chúng mình chỉ có đôi lời như vậy, hy vọng các bông hoa của lớp sẽ có một ngày 20/10 thật vui vẻ và ý nghĩa.";
  let titleTimer = null;
  let bodyTimer = null;

  function startLetterTyping() {
    const title = document.querySelector(".textLetter h2");
    const body = document.querySelector(".contentLetter");
    if (!title || !body) return;

    clearInterval(titleTimer);
    clearInterval(bodyTimer);
    title.textContent = "";
    body.textContent = "";

    let i = 0;
    titleTimer = setInterval(() => {
      title.textContent += titleText[i++];
      if (i >= titleText.length) {
        clearInterval(titleTimer);
        setTimeout(() => {
          let j = 0;
          bodyTimer = setInterval(() => {
            body.textContent += bodyText[j++];
            if (j >= bodyText.length) clearInterval(bodyTimer);
          }, 55);
        }, 500);
      }
    }, 50);
  }

  // ---------- Page interactions ----------
  function initInteractions() {
    const rose = document.getElementById("rose-t");
    const castle = document.getElementById("castle");
    const textClick = document.getElementById("text-click");
    const valentines = document.querySelector(".valentines");
    const card = document.querySelector(".card");
    const letterForm = document.querySelector(".wrapperLetterForm");
    const closeButton = document.querySelector(".fa-xmark");

    if (textClick) {
      setTimeout(() => {
        textClick.style.display = "inherit";
      }, 4000);
    }

    // ---------- Nhạc nền ----------
    const bgm = document.getElementById("bgm");
    const musicBtn = document.getElementById("music-btn");

    function updateMusicBtn() {
      if (musicBtn) musicBtn.textContent = bgm && !bgm.paused ? "🔊" : "🔇";
    }

    function startMusic() {
      if (!bgm || !bgm.paused) return Promise.resolve();
      bgm.volume = 0.6;
      const p = bgm.play();
      return p && typeof p.then === "function" ? p : Promise.resolve();
    }

    if (bgm && musicBtn) {
      musicBtn.classList.add("show");
      bgm.addEventListener("play", updateMusicBtn);
      bgm.addEventListener("pause", updateMusicBtn);
      bgm.addEventListener("error", () => musicBtn.classList.remove("show"), true);
      updateMusicBtn();

      musicBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        if (bgm.paused) {
          bgm.volume = 0.6;
          bgm.play().catch(() => {});
        } else {
          bgm.pause();
        }
      });

      // Thử phát ngay khi mở web. Nếu trình duyệt chặn tự phát tiếng,
      // nhạc sẽ chạy ngay ở lần chạm/bấm đầu tiên của người xem.
      startMusic().catch(() => {
        const events = ["pointerdown", "keydown", "touchstart"];
        const unlock = () => {
          events.forEach((e) => document.removeEventListener(e, unlock, true));
          startMusic().catch(() => {});
        };
        events.forEach((e) => document.addEventListener(e, unlock, true));
      });
    }

    if (rose) {
      rose.addEventListener("click", () => {
        startMusic().catch(() => {});
        rose.style.display = "none";
        if (castle) castle.style.display = "flex";
        if (theSvg) theSvg.style.display = "inherit";
        if (typeof window.startDecorativePath === "function")
          window.startDecorativePath();
      });
    }

    // Phong thư đang đóng: bấm vào để mở ra.
    if (valentines) {
      valentines.addEventListener("click", () => {
        if (valentines.classList.contains("opened")) return;
        valentines.classList.add("opened");
        // Chờ nắp phong thư mở xong (0.6s) rồi mới cho tấm thiệp trượt lên.
        setTimeout(() => valentines.classList.add("ready"), 700);
      });
    }

    // Hover is handled in CSS too (chỉ có tác dụng sau khi phong thư đã mở).
    if (valentines) {
      valentines.addEventListener("pointerenter", () =>
        valentines.classList.add("card-open"),
      );
      valentines.addEventListener("pointerleave", () =>
        valentines.classList.remove("card-open"),
      );
    }

    if (card && letterForm) {
      card.addEventListener("click", (event) => {
        event.stopPropagation();
        letterForm.style.display = "block";
        letterForm.style.opacity = "1";
        startLetterTyping();
      });
    }

    if (closeButton && letterForm) {
      closeButton.addEventListener("click", () => {
        letterForm.style.display = "none";
      });
    }
  }

  function init() {
    initPathAnimation();
    initMagicDust();
    animateRose();
    initInteractions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
