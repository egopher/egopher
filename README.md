# Total Battle: 3D War Game

A 3D battle simulation game built with Three.js and WebGL, inspired by mobile battle games.

![Game Screenshot](screenshot.png)

## Features

- 3D battlefield with squads of soldiers
- Blue player-controlled squad vs red enemy squad
- Multiple weapon types (rifle, machine gun, bow)
- Power-up system for upgrading weapons
- Click-to-move controls for the player squad
- Real-time projectile physics and collisions
- Score tracking system
- Responsive design that works on various screen sizes

## Controls

- **Click on the battlefield**: Move your blue squad to that location
- **Click on weapon buttons**: Spawn a power-up of that weapon type
- **Mouse wheel**: Zoom in/out
- **Click and drag**: Rotate the camera

## Gameplay

1. Control your blue squad to defeat the red enemy squad
2. Collect power-ups to upgrade your weapons
3. Click on the weapon buttons at the bottom to spawn power-ups
4. The game ends when one team is completely defeated

## Technical Details

This game is built using:

- **Three.js**: For 3D rendering and scene management
- **WebGL**: For hardware-accelerated graphics
- **JavaScript**: For game logic and interactions
- **HTML/CSS**: For UI elements and styling

The game architecture includes:

- Models system for creating 3D objects
- Weapons system with different projectile types
- Units system for individual soldiers and squads
- Collision detection for projectiles and power-ups
- Camera controls for player interaction

## Running the Game

Simply open the `index.html` file in a modern web browser that supports WebGL.

```
# Clone the repository
git clone https://github.com/yourusername/total-battle-3d.git

# Navigate to the project directory
cd total-battle-3d

# Open index.html in your browser
```

## Browser Compatibility

The game works best in modern browsers with good WebGL support:
- Chrome (recommended)
- Firefox
- Edge
- Safari

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by mobile battle games like "Total Battle"
- Built with Three.js (https://threejs.org/)
- Special thanks to the Three.js community for their examples and documentation 