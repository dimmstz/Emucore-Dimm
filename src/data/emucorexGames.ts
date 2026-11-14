export interface PS2Game {
  id: string;
  title: string;
  serial: string;
  coverUrl: string;
  size: string;
  genre: string;
  region: string;
  lastPlayed: string;
  isRecent: boolean;
  fpsTarget: number;
}

export const EMUCOREX_LIBRARY: PS2Game[] = [
  {
    id: 'nfs-most-wanted',
    title: 'Need for Speed: Most Wanted',
    serial: 'SLUS-21351',
    coverUrl: '/covers/nfs_most_wanted.jpg',
    size: '3.8 GB',
    genre: 'Corrida / Arcade',
    region: 'NTSC-U',
    lastPlayed: 'Hoje, 05:42',
    isRecent: true,
    fpsTarget: 60.0
  },
  {
    id: 'burnout-revenge',
    title: 'Burnout Revenge',
    serial: 'SLUS-21242',
    coverUrl: '/covers/burnout_revenge.jpg',
    size: '2.9 GB',
    genre: 'Corrida / Combate',
    region: 'NTSC-U',
    lastPlayed: 'Ontem, 21:15',
    isRecent: true,
    fpsTarget: 60.0
  },
  {
    id: 'blade-2',
    title: 'Blade II',
    serial: 'SLUS-20356',
    coverUrl: '/covers/blade2.jpg',
    size: '1.4 GB',
    genre: 'Ação / Hack & Slash',
    region: 'NTSC-U',
    lastPlayed: '18 Out',
    isRecent: false,
    fpsTarget: 60.0
  },
  {
    id: 'crash-bandicoot',
    title: 'Crash Bandicoot: The Wrath of Cortex',
    serial: 'SLUS-20238',
    coverUrl: '/covers/crash_bandicoot.jpg',
    size: '1.1 GB',
    genre: 'Plataforma',
    region: 'NTSC-U',
    lastPlayed: '16 Out',
    isRecent: false,
    fpsTarget: 60.0
  },
  {
    id: 'enter-the-matrix',
    title: 'Enter the Matrix',
    serial: 'SLUS-20454',
    coverUrl: '/covers/enter_the_matrix.jpg',
    size: '4.2 GB',
    genre: 'Ação / Tiro',
    region: 'NTSC-U',
    lastPlayed: '15 Out',
    isRecent: false,
    fpsTarget: 60.0
  },
  {
    id: 'nfs-underground-2',
    title: 'Need for Speed: Underground 2',
    serial: 'SLUS-21065',
    coverUrl: '/covers/nfs_underground_2.jpg',
    size: '3.1 GB',
    genre: 'Corrida / Tuning',
    region: 'NTSC-U',
    lastPlayed: '12 Out',
    isRecent: false,
    fpsTarget: 60.0
  },
  {
    id: 'tekken-5',
    title: 'Tekken 5',
    serial: 'SCES-53202',
    coverUrl: '/covers/tekken5.jpg',
    size: '4.1 GB',
    genre: 'Luta',
    region: 'PAL / NTSC',
    lastPlayed: '10 Out',
    isRecent: false,
    fpsTarget: 60.0
  }
];
