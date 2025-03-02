/**
 * Utility functions for the game
 */

// Generate a random number between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random color
function randomColor() {
    return Math.random() * 0xffffff;
}

// Calculate distance between two points in 3D space
function distance(point1, point2) {
    return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) +
        Math.pow(point2.y - point1.y, 2) +
        Math.pow(point2.z - point1.z, 2)
    );
}

// Check if two objects are colliding (simple sphere collision)
function checkCollision(obj1, obj2) {
    const minDistance = obj1.radius + obj2.radius;
    return distance(obj1.position, obj2.position) < minDistance;
}

// Lerp (Linear interpolation) function
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Clamp a value between min and max
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Convert degrees to radians
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

// Get a random position within the battlefield
function getRandomPosition(width, length) {
    return {
        x: (Math.random() - 0.5) * width,
        y: 0,
        z: (Math.random() - 0.5) * length
    };
}

// Create a delay (promise-based)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
} 