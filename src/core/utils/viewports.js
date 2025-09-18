const commonViewports = [
  // Desktop resolutions
  { width: 1920, height: 1080 }, // Full HD
  { width: 1366, height: 768 },  // Most common laptop
  { width: 1440, height: 900 },  // MacBook Pro
  { width: 1536, height: 864 },  // Surface Laptop
  { width: 1280, height: 720 },  // HD
  { width: 1600, height: 900 },  // 16:9 widescreen
  { width: 2560, height: 1440 }, // 1440p
  { width: 1680, height: 1050 }, // 16:10 aspect
];

function getRandomViewport() {
  const base = commonViewports[Math.floor(Math.random() * commonViewports.length)];

  // Add small random variation to make each session unique
  return {
    width: base.width + Math.floor(Math.random() * 100) - 50,
    height: base.height + Math.floor(Math.random() * 100) - 50
  };
}

function getWalmartOptimizedViewport() {
  // Walmart's responsive design works best with these dimensions
  const walmartViewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 }
  ];

  const base = walmartViewports[Math.floor(Math.random() * walmartViewports.length)];

  return {
    width: base.width + Math.floor(Math.random() * 50) - 25,
    height: base.height + Math.floor(Math.random() * 50) - 25
  };
}

export {
  getRandomViewport,
  getWalmartOptimizedViewport,
  commonViewports
};