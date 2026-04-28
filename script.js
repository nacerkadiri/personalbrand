const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const revealElements = document.querySelectorAll(".reveal");
const progressFill = document.querySelector(".scroll-progress__fill");
const topbar = document.querySelector(".topbar");

const markMediaAsMissing = (element) => {
  if (!element) {
    return;
  }

  element.classList.add("is-missing");

  const fallbackContainer = element.closest(
    ".editorial-media, .portrait-card__frame, .identity-node__icon, .map-canvas, .morocco__visual, .logo-chip",
  );

  fallbackContainer?.classList.add("is-media-missing");
};

const attachMediaFallback = (element) => {
  if (!element || element.dataset.fallbackBound === "true") {
    return;
  }

  element.dataset.fallbackBound = "true";

  const onMissing = () => {
    markMediaAsMissing(element);
  };

  element.addEventListener("error", onMissing);

  if (element.tagName === "VIDEO") {
    element.addEventListener("stalled", onMissing);
    element.addEventListener("abort", onMissing);
  }
};

document.querySelectorAll(".stagger-lines, .origin-feature").forEach((group) => {
  const lines = Array.from(group.querySelectorAll(".stagger-line"));
  lines.forEach((line, index) => {
    line.style.setProperty("--stagger-delay", `${index * 250}ms`);
  });
});

if (!reduceMotionQuery.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const heroLines = Array.from(document.querySelectorAll(".hero__line"));
let activeHeroIndex = 0;

document.querySelectorAll("img").forEach((image) => {
  if (!image.closest(".hero")) {
    image.loading = image.loading || "lazy";
  }

  image.decoding = image.decoding || "async";
  attachMediaFallback(image);
});

document.querySelectorAll("video").forEach((video) => {
  attachMediaFallback(video);
});

if (!reduceMotionQuery.matches && heroLines.length > 1) {
  window.setInterval(() => {
    heroLines[activeHeroIndex].classList.remove("is-active");
    activeHeroIndex = (activeHeroIndex + 1) % heroLines.length;
    heroLines[activeHeroIndex].classList.add("is-active");
  }, 2400);
}

const initPhraseRotator = (rotator) => {
  const lines = Array.from(rotator.querySelectorAll(".phrase-rotator__line"));

  if (lines.length <= 1 || reduceMotionQuery.matches) {
    lines.forEach((line, index) => {
      line.classList.toggle("is-active", index === 0);
    });
    return;
  }

  let activeIndex = 0;
  const type = rotator.dataset.rotator;

  if (type === "audience") {
    lines.forEach((line) => line.classList.remove("is-active"));
    return;
  }

  window.setInterval(() => {
    lines[activeIndex].classList.remove("is-active");
    activeIndex = (activeIndex + 1) % lines.length;
    lines[activeIndex].classList.add("is-active");
  }, 1400);
};

document.querySelectorAll("[data-rotator]").forEach((rotator) => {
  initPhraseRotator(rotator);
});

const initCarousel = (carousel) => {
  const track = carousel.querySelector(".carousel__track");
  const slides = Array.from(track?.children ?? []);
  const dots = Array.from(carousel.querySelectorAll(".carousel__dot"));
  const prevButton = carousel.querySelector('[data-direction="prev"]');
  const nextButton = carousel.querySelector('[data-direction="next"]');
  const statusCurrent = carousel.querySelector(".carousel__status-current");
  const statusTotal = carousel.querySelector(".carousel__status-total");

  if (!track || slides.length === 0) {
    return;
  }

  let index = 0;
  let autoplayId = null;

  if (statusTotal) {
    statusTotal.textContent = String(slides.length).padStart(2, "0");
  }

  const update = () => {
    track.style.transform = `translateX(-${index * 100}%)`;

    if (statusCurrent) {
      statusCurrent.textContent = String(index + 1).padStart(2, "0");
    }

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
    });
  };

  const goTo = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    update();
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  prevButton?.addEventListener("click", prev);
  nextButton?.addEventListener("click", next);

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => goTo(dotIndex));
  });

  const autoplay = carousel.dataset.autoplay === "true";

  const startAutoplay = () => {
    if (!autoplay || reduceMotionQuery.matches) {
      return;
    }

    autoplayId = window.setInterval(next, 5200);
  };

  const stopAutoplay = () => {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
  };

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", startAutoplay);

  update();
  startAutoplay();
};

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  initCarousel(carousel);
});

const setMediaVariant = (element, baseClassName, modifier) => {
  if (!element) {
    return;
  }

  element.className = `${baseClassName} editorial-media--${modifier}`;
};

const updateEditorialAsset = (container, asset) => {
  if (!container || !asset?.src) {
    return;
  }

  const existingAsset = container.querySelector(
    ".editorial-media__asset, .editorial-media__video",
  );
  const needsVideo = asset.type === "video";
  const hasVideo = existingAsset?.tagName === "VIDEO";
  let mediaElement = existingAsset;

  if (!mediaElement || needsVideo !== hasVideo) {
    mediaElement = document.createElement(needsVideo ? "video" : "img");
    existingAsset?.replaceWith(mediaElement);

    if (!existingAsset) {
      container.prepend(mediaElement);
    }
  }

  if (needsVideo) {
    mediaElement.className = "editorial-media__video";
    mediaElement.src = asset.src;
    mediaElement.muted = true;
    mediaElement.loop = true;
    mediaElement.autoplay = true;
    mediaElement.playsInline = true;
    mediaElement.setAttribute("aria-label", asset.alt ?? "");
    mediaElement.removeAttribute("alt");
    mediaElement.play?.().catch(() => {});
  } else {
    mediaElement.className = "editorial-media__asset";
    mediaElement.src = asset.src;
    mediaElement.alt = asset.alt ?? "";
    mediaElement.loading = "lazy";
    mediaElement.decoding = "async";
  }

  attachMediaFallback(mediaElement);
  container.classList.toggle("is-contain", asset.fit === "contain");
  container.classList.toggle("is-logo", asset.fit === "logo");
};

const traitTitle = document.querySelector(".brand-star__title");
const traitSignal = document.querySelector(".brand-star__signal");
const traitExample = document.querySelector(".brand-star__example");
const traitMedia = document.querySelector(".brand-star__media");
const starNodes = Array.from(document.querySelectorAll(".star-node"));

const traitAssets = {
  ambitious: {
    src: "ambitious.JPG",
    alt: "Ambitious brand trait",
  },
  visionary: {
    src: "visionary.JPG",
    alt: "Visionary brand trait",
  },
  grounded: {
    src: "grounded.jpg",
    alt: "Grounded brand trait",
  },
  collective: {
    src: "collective.JPG",
    alt: "Collective brand trait",
  },
  determined: {
    src: "determined.JPG",
    alt: "Determined brand trait",
  },
};

const setActiveTrait = (node) => {
  starNodes.forEach((item) => item.classList.toggle("is-active", item === node));

  if (traitTitle) {
    traitTitle.textContent = node.dataset.trait ?? "";
  }

  if (traitSignal) {
    traitSignal.textContent = node.dataset.signal ?? "";
  }

  if (traitExample) {
    traitExample.textContent = node.dataset.example ?? "";
  }

  if (traitMedia && node.dataset.media) {
    setMediaVariant(
      traitMedia,
      "editorial-media brand-star__media",
      `trait-${node.dataset.media}`,
    );
    updateEditorialAsset(traitMedia, traitAssets[node.dataset.media]);
  }
};

starNodes.forEach((node) => {
  node.addEventListener("mouseenter", () => setActiveTrait(node));
  node.addEventListener("focus", () => setActiveTrait(node));
  node.addEventListener("click", () => setActiveTrait(node));
});

const ikigaiTitle = document.querySelector(".ikigai__title");
const ikigaiCopy = document.querySelector(".ikigai__copy");
const ikigaiNodes = Array.from(document.querySelectorAll(".ikigai__quadrant"));

const setActiveIkigai = (node) => {
  ikigaiNodes.forEach((item) => item.classList.toggle("is-active", item === node));

  if (ikigaiTitle) {
    ikigaiTitle.textContent = node.dataset.title ?? "";
  }

  if (ikigaiCopy) {
    ikigaiCopy.textContent = node.dataset.copy ?? "";
  }
};

ikigaiNodes.forEach((node) => {
  node.addEventListener("mouseenter", () => setActiveIkigai(node));
  node.addEventListener("focus", () => setActiveIkigai(node));
  node.addEventListener("click", () => setActiveIkigai(node));
});

const metricValues = Array.from(document.querySelectorAll(".metric-card__value"));
let metricsAnimated = false;
const numberFormatter = new Intl.NumberFormat("en-US");

const formatMetric = (value, prefix, suffix) => {
  return `${prefix}${numberFormatter.format(Math.round(value))}${suffix}`;
};

const animateMetrics = () => {
  if (metricsAnimated) {
    return;
  }

  metricsAnimated = true;

  metricValues.forEach((metric) => {
    const target = Number(metric.dataset.target ?? "0");
    const prefix = metric.dataset.prefix ?? "";
    const suffix = metric.dataset.suffix ?? "";
    const duration = 1700;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = target * eased;
      metric.textContent = formatMetric(currentValue, prefix, suffix);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        metric.textContent = formatMetric(target, prefix, suffix);
      }
    };

    window.requestAnimationFrame(tick);
  });
};

const metricsSection = document.querySelector("#metrics");

if (metricsSection) {
  const metricsObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateMetrics();
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.35,
    },
  );

  metricsObserver.observe(metricsSection);
}

const timelineData = {
  born: {
    step: "Milestone 01",
    title: "Born",
    date: "October 25, 2007",
    copy:
      "Born in Casablanca, in a family and a country that shaped how I see responsibility, community, and ambition from the start.",
    meta: ["Casablanca", "Morocco", "Beginning"],
    media: "timeline-born",
    src: "BORN.JPG",
    alt: "Born milestone",
    mediaTag: "Casablanca",
    mediaCaption: "The beginning of the arc",
  },
  diagnosis: {
    step: "Milestone 02",
    title: "Diagnosis",
    date: "2009",
    copy:
      "Dr. Arnoux's diagnosis placed me among just 42 known cases worldwide, making rarity part of daily life long before leadership became public.",
    meta: ["42 cases", "Dr. Arnoux", "Resilience"],
    media: "timeline-diagnosis",
    src: "Diagnosis.JPG",
    alt: "Diagnosis milestone",
    mediaTag: "42 cases worldwide",
    mediaCaption: "Rarity becomes resolve",
  },
  grandfroid: {
    step: "Milestone 03",
    title: "First Humanitarian Action",
    date: "2022",
    copy:
      "This was the first time I asserted myself as a leader. 1,000 families reached, $125,000 raised. More importantly, it proved something - that it was possible.",
    meta: ["Operation Grand Froid", "1,000 families", "$125,000 raised"],
    media: "timeline-grandfroid",
    src: "First%20Action.JPG",
    alt: "Operation Grand Froid milestone",
    mediaTag: "Operation Grand Froid",
    mediaCaption: "First field proof",
  },
  unprogram: {
    step: "Milestone 04",
    title: "UN Program",
    date: "2023",
    copy:
      "Participation in a UN-linked program expanded the frame, showing that local leadership could carry enough clarity and credibility to enter international conversations.",
    meta: ["United Nations", "Global exposure", "Youth voice"],
    media: "timeline-unprogram",
    src: "UN%20program.JPG",
    alt: "UN program milestone",
    mediaTag: "UN program",
    mediaCaption: "Local leadership enters global rooms",
  },
  earthquake: {
    step: "Milestone 05",
    title: "Morocco Earthquake",
    date: "September 2023",
    copy:
      "The Al Haouz earthquake changed everything immediately. It was no longer enough to feel empathy - leadership had to organize response, reconstruction, and hope under pressure.",
    meta: ["Al Haouz", "Urgency", "Turning point"],
    media: "timeline-earthquake",
    src: "Morocco%20Earthquake.JPG",
    alt: "Morocco earthquake milestone",
    mediaTag: "Al Haouz earthquake",
    mediaCaption: "Crisis becomes responsibility",
  },
  school: {
    step: "Milestone 06",
    title: "School Inauguration",
    date: "June 11, 2024",
    copy:
      "The Tassa Ouirgane school opened after 265 days of work. The rebuilt site expanded from roughly 200 square meters to more than 1,040 square meters, including three classrooms, a preschool room, and a playground.",
    meta: ["June 11, 2024", "265 days", "1,047 m2"],
    media: "timeline-school",
    src: "inauguration.JPG",
    alt: "School inauguration milestone",
    mediaTag: "Tassa Ouirgane",
    mediaCaption: "A school becomes public proof",
  },
  uninvitation: {
    step: "Milestone 07",
    title: "UN Invitation",
    date: "October 2024",
    copy:
      "A UN invitation in October 2024 signaled the next layer of recognition: not only participation in a program, but entry into higher-level institutional spaces.",
    meta: ["October 2024", "UN invitation", "Institutional recognition"],
    media: "timeline-uninvitation",
    src: "UN%20invitation.JPG",
    alt: "UN invitation milestone",
    mediaTag: "October 2024",
    mediaCaption: "Recognition deepens",
  },
  medical: {
    step: "Milestone 08",
    title: "Medical Caravan",
    date: "2025",
    copy:
      "The medical caravan widened the mission from educational recovery to direct health access, showing that the work was never meant to stop at one successful project.",
    meta: ["Health access", "Atlas region", "Expansion"],
    media: "timeline-medical",
    src: "caravan.JPG",
    alt: "Medical caravan milestone",
    mediaTag: "Medical caravan",
    mediaCaption: "Access widens beyond education",
  },
  berkeley: {
    step: "Milestone 09",
    title: "Berkeley",
    date: "2025",
    copy:
      "UC Berkeley becomes the current academic platform, sharpening the transition from visible youth leadership to broader systems thinking, strategy, and global positioning.",
    meta: ["UC Berkeley", "Academic platform", "Global systems"],
    media: "timeline-berkeley",
    src: "BERKELEY.png",
    alt: "Berkeley milestone",
    fit: "logo",
    mediaTag: "UC Berkeley",
    mediaCaption: "The platform widens",
  },
  meef: {
    step: "Milestone 10",
    title: "MEEF",
    date: "2027",
    copy:
      "MEEF - the MENA Entertainment Economy Forum - is a platform designed to connect capital, culture, and institutions and position the region globally.",
    meta: ["MENA Entertainment Economy Forum", "Capital", "Institutions"],
    media: "timeline-meef",
    src: "MEEF.jpg",
    alt: "MEEF milestone",
    fit: "contain",
    mediaTag: "MEEF",
    mediaCaption: "Future institutional horizon",
  },
};

const timelineNav = document.querySelector("#timeline-nav");
const timelineButtons = Array.from(
  document.querySelectorAll(".timeline-nav__item"),
);
const timelineStep = document.querySelector("#timeline-step");
const timelineTitle = document.querySelector("#timeline-title");
const timelineDate = document.querySelector("#timeline-date");
const timelineCopy = document.querySelector("#timeline-copy");
const timelineMeta = document.querySelector("#timeline-meta");
const timelineMedia = document.querySelector("#timeline-media");
const timelineMediaTag = document.querySelector("#timeline-media-tag");
const timelineMediaCaption = document.querySelector("#timeline-media-caption");

const setTimeline = (id) => {
  const data = timelineData[id];

  if (!data) {
    return;
  }

  const activeIndex = timelineButtons.findIndex(
    (button) => button.dataset.timelineId === id,
  );

  timelineButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.timelineId === id);
  });

  if (timelineNav && activeIndex >= 0) {
    const progress =
      timelineButtons.length > 1 ? activeIndex / (timelineButtons.length - 1) : 0;
    timelineNav.style.setProperty("--timeline-progress", String(progress));
  }

  if (timelineStep) {
    timelineStep.textContent = data.step;
  }

  if (timelineTitle) {
    timelineTitle.textContent = data.title;
  }

  if (timelineDate) {
    timelineDate.textContent = data.date;
  }

  if (timelineCopy) {
    timelineCopy.textContent = data.copy;
  }

  if (timelineMediaTag) {
    timelineMediaTag.textContent = data.mediaTag;
  }

  if (timelineMediaCaption) {
    timelineMediaCaption.textContent = data.mediaCaption;
  }

  if (timelineMeta) {
    timelineMeta.innerHTML = data.meta
      .map((item) => `<span>${item}</span>`)
      .join("");
  }

  if (timelineMedia) {
    setMediaVariant(
      timelineMedia,
      "editorial-media timeline-detail__media",
      data.media,
    );
    updateEditorialAsset(timelineMedia, data);
  }
};

timelineButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTimeline(button.dataset.timelineId ?? "");
  });
});

if (timelineButtons.length > 0) {
  setTimeline(timelineButtons[0].dataset.timelineId ?? "born");
}

const mapData = {
  casablanca: {
    title: "Casablanca",
    copy:
      "Casablanca is the origin point: the city where the story begins and where early ambition first takes public shape.",
    media: "map-casablanca",
    src: "casablanca.JPG",
    alt: "Casablanca location",
    mediaTag: "Birthplace",
    mediaCaption: "Where the story begins",
  },
  "marrakech-earthquake": {
    title: "Marrakech / Earthquake",
    copy:
      "The earthquake response around the Marrakech region transformed empathy into urgent public leadership and forced the question of what youth should do in crisis.",
    media: "map-marrakech-earthquake",
    src: "Morocco%20Earthquake.JPG",
    alt: "Marrakech earthquake location",
    mediaTag: "September 2023",
    mediaCaption: "Crisis changes the stakes",
  },
  "marrakech-school": {
    title: "Tassa Ouirgane / School",
    copy:
      "Near Marrakech, the school rebuilt in Tassa Ouirgane became proof that a single initiative can turn into infrastructure for an entire community.",
    media: "map-marrakech-school",
    src: "school.JPG",
    alt: "Marrakech school location",
    mediaTag: "June 11, 2024",
    mediaCaption: "Rebuilding becomes proof",
  },
  atlas: {
    title: "Atlas Mountains / Medical Caravan",
    copy:
      "The Atlas Mountains expanded the mission from education access to health access, extending care into communities shaped by terrain and distance.",
    media: "map-atlas",
    src: "Atlas%20Mountains.JPG",
    alt: "Atlas Mountains location",
    mediaTag: "Medical caravan",
    mediaCaption: "Access across terrain",
  },
  newyork: {
    title: "New York / United Nations",
    copy:
      "United Nations spaces in New York gave local action international visibility and positioned lived experience inside global conversations.",
    media: "map-newyork",
    src: "new%20york.JPG",
    alt: "New York United Nations location",
    mediaTag: "United Nations",
    mediaCaption: "Local reality meets global institutions",
  },
  berkeley: {
    title: "Berkeley",
    copy:
      "Berkeley is the current base: a platform for deeper strategy, stronger networks, and a clearer path from projects to systems.",
    media: "map-berkeley",
    src: "glade.jpg",
    alt: "Berkeley location",
    mediaTag: "Current platform",
    mediaCaption: "Academic leverage for scale",
  },
  northafrica: {
    title: "North Africa / Rotary",
    copy:
      "Youth initiatives across North Africa show that the work is not confined to one city or one project. It is regional in ambition and coalition-based in method.",
    media: "map-northafrica",
    src: "north-africa.mp4",
    alt: "North Africa Rotary video",
    type: "video",
    mediaTag: "Regional leadership",
    mediaCaption: "Coalitions across North Africa",
  },
  mena: {
    title: "MENA / MEEF",
    copy:
      "MEEF represents the future regional horizon: a broader MENA platform for institution-building, influence, and mission-driven scale.",
    media: "map-mena",
    src: "MENA.jpg",
    alt: "MENA MEEF location",
    fit: "contain",
    mediaTag: "Future horizon",
    mediaCaption: "MENA-wide institutional ambition",
  },
};

const mapPoints = Array.from(document.querySelectorAll(".map-point"));
const mapTitle = document.querySelector("#map-title");
const mapCopy = document.querySelector("#map-copy");
const mapMedia = document.querySelector("#map-media");
const mapMediaTag = document.querySelector("#map-media-tag");
const mapMediaCaption = document.querySelector("#map-media-caption");

const setMapLocation = (id) => {
  const data = mapData[id];

  if (!data) {
    return;
  }

  mapPoints.forEach((point) => {
    point.classList.toggle("is-active", point.dataset.locationId === id);
  });

  if (mapTitle) {
    mapTitle.textContent = data.title;
  }

  if (mapCopy) {
    mapCopy.textContent = data.copy;
  }

  if (mapMediaTag) {
    mapMediaTag.textContent = data.mediaTag;
  }

  if (mapMediaCaption) {
    mapMediaCaption.textContent = data.mediaCaption;
  }

  if (mapMedia) {
    setMediaVariant(mapMedia, "editorial-media map-detail__media", data.media);
    updateEditorialAsset(mapMedia, data);
  }
};

mapPoints.forEach((point) => {
  point.addEventListener("click", () => {
    setMapLocation(point.dataset.locationId ?? "");
  });
});

if (mapPoints.length > 0) {
  setMapLocation(mapPoints[0].dataset.locationId ?? "casablanca");
}

const syncScrollState = () => {
  const scrollTop = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const documentProgress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

  if (progressFill) {
    progressFill.style.width = `${documentProgress}%`;
  }

  if (topbar) {
    topbar.classList.toggle("is-compact", scrollTop > 28);
  }
};

syncScrollState();
window.addEventListener("scroll", syncScrollState, { passive: true });
window.addEventListener("resize", syncScrollState);
