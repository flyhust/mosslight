import Phaser from 'phaser';
import { HollowScene } from './game/scene.ts';
import './style.css';
new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', backgroundColor: '#1b3027', pixelArt: true, roundPixels: true,
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [HollowScene], render: { antialias: false, powerPreference: 'high-performance' },
  input: { keyboard: false, mouse: false, touch: false }, audio: { noAudio: true },
});
