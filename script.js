// Initialize intro text
const introText = document.querySelector(".text-intro");
introText.innerHTML = `Hi You! Pull the cord.`;

// Matter.js setup
const engine = Matter.Engine.create();
const world = engine.world;

// Get screen dimensions
const getScreenDimensions = () => ({
  width: window.innerWidth,
  height: window.innerHeight
});

let dimensions = getScreenDimensions();

const render = Matter.Render.create({
  element: document.getElementById("canvas-container"),
  engine: engine,
  options: {
    width: dimensions.width,
    height: dimensions.height,
    wireframes: false,
    background: "transparent"
  }
});

// Create a chain of points for the ribbon
const segments = 10;
const segmentHeight = 150 / segments;
const points = [];
const constraints = [];

// Get card position
const card = document.querySelector(".card");
const getCardPosition = () => {
  const cardRect = card.getBoundingClientRect();
  return {
    x: dimensions.width / 2,
    y: cardRect.top
  };
};

let cardPosition = getCardPosition();

// Create points
for (let i = 0; i <= segments; i++) {
  const point = Matter.Bodies.circle(
    cardPosition.x,
    cardPosition.y + i * segmentHeight,
    2,
    {
      friction: 0.5,
      restitution: 0.5,
      isStatic: i === 0,
      render: {
        visible: true,
        fillStyle: "#000000",
        strokeStyle: "#000000"
      }
    }
  );
  points.push(point);
  Matter.World.add(world, point);
}

// Connect points with constraints
for (let i = 0; i < points.length - 1; i++) {
  const constraint = Matter.Constraint.create({
    bodyA: points[i],
    bodyB: points[i + 1],
    stiffness: 0.1,
    damping: 0.05,
    length: segmentHeight,
    render: {
      visible: true,
      strokeStyle: "#fe3a65",
      lineWidth: 1
    }
  });
  constraints.push(constraint);
  Matter.World.add(world, constraint);
}

// Create and start the runner
const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);
Matter.Render.run(render);

// Drag functionality
let isDragging = false;
const cordWrapper = document.querySelector(".cord-wrapper");
const plug = document.querySelector(".plug");
const ribbon = document.querySelector(".ribbon");

// Enhanced touch/mouse event handling
const getEventCoordinates = (e) => {
  if (e.touches && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }
  return {
    x: e.clientX,
    y: e.clientY
  };
};

const startDrag = (e) => {
  e.preventDefault();
  isDragging = true;
  plug.style.cursor = "grabbing";
  
  // Add visual feedback
  gsap.to(plug, {
    scale: 1.1,
    duration: 0.2
  });
};

const drag = (e) => {
  if (!isDragging) return;
  e.preventDefault();

  const coords = getEventCoordinates(e);
  const lastPoint = points[points.length - 1];
  
  Matter.Body.setPosition(lastPoint, {
    x: coords.x,
    y: coords.y
  });

  updateRibbon();

  // Get current card position for accurate detection
  const currentCardRect = card.getBoundingClientRect();
  const pullThreshold = dimensions.height < 600 ? 200 : 300;

  if (coords.y > currentCardRect.top + pullThreshold && !card.classList.contains("open")) {
    openCard();
  }
};

const endDrag = (e) => {
  if (!isDragging) return;
  e.preventDefault();
  
  isDragging = false;
  plug.style.cursor = "grab";
  
  // Remove visual feedback
  gsap.to(plug, {
    scale: 1,
    duration: 0.2
  });
};

// Add event listeners for both mouse and touch
plug.addEventListener("mousedown", startDrag);
plug.addEventListener("touchstart", startDrag, { passive: false });
document.addEventListener("mousemove", drag);
document.addEventListener("touchmove", drag, { passive: false });
document.addEventListener("mouseup", endDrag);
document.addEventListener("touchend", endDrag, { passive: false });

function updateRibbon() {
  const segments = points.length;

  for (let i = 0; i < segments - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    const dx = next.position.x - current.position.x;
    const dy = next.position.y - current.position.y;
    const angle = Math.atan2(dy, dx);

    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    gsap.set(ribbon, {
      height: segmentLength,
      rotation: angle * (180 / Math.PI),
      x: current.position.x - cardPosition.x,
      y: current.position.y - cardPosition.y
    });

    // Update plug position and rotation
    if (i === segments - 2) {
      gsap.set(plug, {
        x: next.position.x - cardPosition.x,
        y: next.position.y - cardPosition.y - 20,
        rotation: angle * (180 / Math.PI) - 90,
        transformOrigin: "50% 0%"
      });
    }
  }
}

function openCard() {
  card.classList.add("open");

  // Vibration API for mobile devices (if supported)
  if (navigator.vibrate) {
    navigator.vibrate([50, 30, 50, 30, 50]);
  }

  // Shock effect (vibration animation)
  gsap.to(card, {
    y: "+=20",
    yoyo: true,
    repeat: 5,
    duration: 0.05,
    onComplete: () => {
      gsap.set(card, { y: 0 });
    }
  });

  // Confetti effect
  confetti({
    particleCount: 200,
    spread: 100,
    origin: { y: 0.6 },
    zIndex: 9999
  });

  // Morph plug
  gsap.to(".plug path", {
    duration: 0.5,
    attr: { d: "M30,0 L70,0 L85,30 L85,120 L15,120 L15,30 Z" },
    ease: "power2.inOut"
  });

  // Show content
  gsap.to(".card-content", {
    opacity: 1,
    duration: 0.5,
    delay: 0.3
  });

  // Show valentine text and buttons
  gsap.to(".valentine-text, .buttons", {
    display: "block",
    opacity: 1,
    duration: 0.5,
    delay: 0.5
  });

  // Hide ribbon and cord
  gsap.to([cordWrapper, ribbon], {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      cordWrapper.style.display = "none";
      ribbon.style.display = "none";
    }
  });

  const tl = new gsap.timeline();
  tl.to(".card", { rotateX: -10, duration: 0.2 })
    .to(".card", { rotateX: 0, duration: 0.1 })
    .to(".card", { rotateX: 10, duration: 0.14 })
    .to(".card", { rotateX: 0, duration: 0.05 })
    .repeat(2);

  gsap.to(".text-intro", {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      introText.style.display = "none";
    }
  });

  // Hide Matter.js points and constraints
  points.forEach((point) => {
    point.render.visible = false;
  });
  constraints.forEach((constraint) => {
    constraint.render.visible = false;
  });
}

// Button event listeners
const yesButton = document.querySelector(".buttons .yes");
const noButton = document.querySelector(".buttons .no");

// YES BUTTON - Simple and straightforward
const handleYesClick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Vibration feedback
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }

  const tl = new gsap.timeline();
  gsap.to(".valentine-text, .buttons", {
    display: "none",
    opacity: 0,
    duration: 0.5
  });
  gsap.to(".valentine-congrats", {
    display: "block",
    opacity: 1,
    duration: 0.5,
    delay: 0.5
  });
  
  const maxWidth = dimensions.width < 420 ? dimensions.width * 0.95 : 800;
  const maxHeight = dimensions.width < 420 ? 540 : 540;
  
  tl.to(".card", {
    width: maxWidth,
    height: maxHeight,
    duration: 1,
    ease: "power2.in"
  }).to(".congrats, .valentine-congrats", {
    width: "100%",
    height: "100%",
    duration: 1
  });

  confetti({
    particleCount: 300,
    spread: 150,
    origin: { y: 0.6 },
    zIndex: 9999
  });

  const confettiInterval = setInterval(() => {
    confetti({
      particleCount: 300,
      spread: 150,
      origin: { y: 0.6 },
      zIndex: 9999
    });
  }, 5000);

  // Clear interval after 30 seconds to prevent performance issues
  setTimeout(() => clearInterval(confettiInterval), 30000);
};

// Add Yes button listeners
yesButton.addEventListener("click", handleYesClick);
yesButton.addEventListener("touchend", (e) => {
  e.preventDefault();
  handleYesClick(e);
}, { passive: false });

// NO BUTTON - Handle sad path (only if they manage to click it)
const handleNoClick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Vibration feedback
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }

  const tl = new gsap.timeline();
  gsap.to(".valentine-text, .buttons", {
    display: "none",
    opacity: 0,
    duration: 0.5
  });
  gsap.to(".valentine-sad", {
    display: "block",
    opacity: 1,
    duration: 0.5,
    delay: 0.5
  });
  
  const maxWidth = dimensions.width < 420 ? dimensions.width * 0.95 : 800;
  const maxHeight = dimensions.width < 420 ? 540 : 540;
  
  tl.to(".card", {
    width: maxWidth,
    height: maxHeight,
    duration: 1,
    ease: "power2.in"
  });
  tl.to(".valentine-sad", {
    width: "100%",
    height: "100%",
    duration: 0.3
  });
  tl.to(".sad", {
    width: "90%",
    height: "100%",
    duration: 0.7
  });
};

// NO BUTTON DODGE - Make it move away!
let noButtonMoveCount = 0;
const maxNoButtonMoves = 20;

const dodgeNoButton = () => {
  if (noButtonMoveCount >= maxNoButtonMoves) {
    // After 20 dodges, allow the click
    return;
  }

  noButtonMoveCount++;
  
  const minDisplacement = dimensions.width < 480 ? 70 : 100;
  const maxDisplacement = dimensions.width < 480 ? 200 : 350;

  const getRandomDisplacement = (min, max) => {
    let displacement = Math.random() * (max - min) + min;
    return Math.random() < 0.5 ? -displacement : displacement;
  };

  const buttonRect = noButton.getBoundingClientRect();
  const viewportWidth = dimensions.width - buttonRect.width - 20;
  const viewportHeight = dimensions.height - buttonRect.height - 20;

  let x = getRandomDisplacement(minDisplacement, maxDisplacement);
  let y = getRandomDisplacement(minDisplacement, maxDisplacement);

  // Ensure button stays within screen boundaries
  const currentX = buttonRect.left;
  const currentY = buttonRect.top;

  if (currentX + x < 10) x = Math.abs(x);
  if (currentX + x > viewportWidth) x = -Math.abs(x);
  if (currentY + y < 10) y = Math.abs(y);
  if (currentY + y > viewportHeight) y = -Math.abs(y);

  gsap.to(noButton, {
    x: `+=${x}`,
    y: `+=${y}`,
    duration: 0.3,
    ease: "power2.out"
  });
};

// Desktop: dodge on mouseenter
noButton.addEventListener("mouseenter", dodgeNoButton);

// Mobile: dodge on touchstart BEFORE any click can happen
noButton.addEventListener("touchstart", (e) => {
  if (noButtonMoveCount < maxNoButtonMoves) {
    dodgeNoButton();
  }
}, { passive: true });

// Only allow click/touchend after max dodges
noButton.addEventListener("click", (e) => {
  if (noButtonMoveCount >= maxNoButtonMoves) {
    handleNoClick(e);
  }
});

noButton.addEventListener("touchend", (e) => {
  if (noButtonMoveCount >= maxNoButtonMoves) {
    e.preventDefault();
    handleNoClick(e);
  }
}, { passive: false });

// Animation loop
function animate() {
  updateRibbon();
  requestAnimationFrame(animate);
}
animate();

// Initial card setup
gsap.set(".card", {
  rotateX: 0,
  transformPerspective: 1000
});

// Handle orientation and resize changes
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    dimensions = getScreenDimensions();
    cardPosition = getCardPosition();
    
    // Update Matter.js render dimensions
    render.canvas.width = dimensions.width;
    render.canvas.height = dimensions.height;
    render.options.width = dimensions.width;
    render.options.height = dimensions.height;
  }, 250);
});

// Prevent default touch behaviors that might interfere
document.addEventListener("touchmove", (e) => {
  if (isDragging) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent pull-to-refresh on mobile browsers
document.body.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1 && window.scrollY === 0) {
    e.preventDefault();
  }
}, { passive: false });
