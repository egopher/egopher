/**
 * Main entry point for the game
 */

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing game");
    
    try {
        // Create new game instance
        const game = new Game();
        console.log("Game successfully initialized");
        
        // Store game reference globally for debugging
        window.gameInstance = game;
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}); 