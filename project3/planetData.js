// Scientific data only (approximate values). No rendering code lives here.
// aAU = semi-major axis (AU), ecc = orbital eccentricity, rotationHours < 0 means retrograde.
export const SUN = {
  id: 'sun', name: 'Sun', category: 'G-type main-sequence star', radiusKm: 695700,
  temperatureC: 5500, description: 'The star at the centre of the Solar System, holding 99.8% of its mass.'
};

export const PLANETS = [
  { id: 'mercury', name: 'Mercury', category: 'Terrestrial planet', radiusKm: 2440, aAU: 0.387, ecc: 0.206, periodDays: 88, rotationHours: 1407.6, tiltDeg: 0.03, temperatureC: 167, moons: 0,
    tex: { type: 'rock', colors: ['#8c8178', '#6f665e', '#a39a90', '#5a534d'] },
    description: 'The smallest planet and the closest to the Sun, with a heavily cratered surface and almost no atmosphere.',
    facts: ['A solar day on Mercury lasts about 176 Earth days.', 'It has the most eccentric orbit of the eight planets.'] },
  { id: 'venus', name: 'Venus', category: 'Terrestrial planet', radiusKm: 6052, aAU: 0.723, ecc: 0.007, periodDays: 224.7, rotationHours: -5832.5, tiltDeg: 177.4, temperatureC: 464, moons: 0,
    tex: { type: 'bands', colors: ['#d9b36a', '#e8c88a', '#c79a52', '#f0d9a8'] },
    description: 'A rocky planet wrapped in thick carbon-dioxide clouds that trap heat, making it the hottest planet.',
    facts: ['It rotates backwards compared with most planets.', 'Surface pressure is roughly 92 times Earth\'s.'] },
  { id: 'earth', name: 'Earth', category: 'Terrestrial planet', radiusKm: 6371, aAU: 1.0, ecc: 0.017, periodDays: 365.25, rotationHours: 23.93, tiltDeg: 23.4, temperatureC: 15, moons: 1,
    tex: { type: 'earth', colors: ['#1b4f9c', '#2f7d3a', '#4f8f45', '#c9b987', '#e8f0f5'] },
    description: 'The only known world with liquid surface water and life, protected by a magnetic field and a nitrogen-oxygen atmosphere.',
    facts: ['About 71% of its surface is covered by water.', 'Its Moon stabilises the tilt of its axis.'] },
  { id: 'mars', name: 'Mars', category: 'Terrestrial planet', radiusKm: 3390, aAU: 1.524, ecc: 0.093, periodDays: 687, rotationHours: 24.62, tiltDeg: 25.2, temperatureC: -63, moons: 2,
    tex: { type: 'rock', colors: ['#b5532f', '#8f3d22', '#d17a4d', '#6e2f1a'] },
    description: 'A cold desert world whose iron-rich dust gives it a red colour; home to Olympus Mons, the tallest known volcano.',
    facts: ['Olympus Mons is about 22 km high.', 'Its two moons are Phobos and Deimos.'] },
  { id: 'jupiter', name: 'Jupiter', category: 'Gas giant', radiusKm: 69911, aAU: 5.203, ecc: 0.049, periodDays: 4333, rotationHours: 9.93, tiltDeg: 3.1, temperatureC: -108, moons: 95,
    tex: { type: 'bands', colors: ['#c9a27a', '#e6d2b5', '#a8744a', '#8a5a3a', '#f2e6d0'] },
    description: 'The largest planet, a gas giant with banded clouds and the Great Red Spot, a storm larger than Earth.',
    facts: ['It is more than twice as massive as all other planets combined.', 'Its day is under 10 hours.'] },
  { id: 'saturn', name: 'Saturn', category: 'Gas giant', radiusKm: 58232, aAU: 9.537, ecc: 0.057, periodDays: 10759, rotationHours: 10.7, tiltDeg: 26.7, temperatureC: -139, moons: 146,
    tex: { type: 'bands', colors: ['#d8c28f', '#e9dab0', '#bda66f', '#f3e8c8'] }, rings: { inner: 1.3, outer: 2.3, color: '#cdbb92' },
    description: 'A gas giant famous for its bright ring system of ice and rock particles; less dense than water.',
    facts: ['Its rings span up to ~280,000 km but are often only ~10 m thick.', 'Titan, its largest moon, has a dense atmosphere.'] },
  { id: 'uranus', name: 'Uranus', category: 'Ice giant', radiusKm: 25362, aAU: 19.19, ecc: 0.046, periodDays: 30687, rotationHours: -17.24, tiltDeg: 97.8, temperatureC: -197, moons: 28,
    tex: { type: 'bands', colors: ['#8fd3d8', '#a7e0e4', '#7bbfc5'] }, rings: { inner: 1.4, outer: 1.7, color: '#9fbfc4' },
    description: 'An ice giant tipped on its side, with methane in its atmosphere giving it a pale cyan colour.',
    facts: ['Its axis is tilted about 98°, so it rolls around the Sun.', 'It has faint rings discovered in 1977.'] },
  { id: 'neptune', name: 'Neptune', category: 'Ice giant', radiusKm: 24622, aAU: 30.07, ecc: 0.009, periodDays: 60190, rotationHours: 16.11, tiltDeg: 28.3, temperatureC: -201, moons: 16,
    tex: { type: 'bands', colors: ['#2f4fc9', '#4468e0', '#233fa3', '#6a85f0'] },
    description: 'The most distant planet, a dark, windy ice giant with the fastest winds measured in the Solar System.',
    facts: ['Winds can exceed 2,000 km/h.', 'It was found by mathematical prediction before being observed.'] }
];
