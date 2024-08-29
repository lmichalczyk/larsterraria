const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const tileSize = 20;
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: tileSize,
    height: tileSize * 2,
    speed: 5,
    velocityY: 0,
    jumping: false,
    health: 100,
    inventory: [],
    selectedItem: 0
};

const terrainTypes = {
    DIRT: { color: '#8B4513', id: 0 },
    STONE: { color: '#A9A9A9', id: 1 },
    GRASS: { color: '#228B22', id: 2 }
};

const terrain = [];

const gravity = 0.5;
const jumpStrength = -10;

const keys = {};

const enemies = [];
const items = [];

const itemTypes = {
    WOOD: { name: 'Tre', color: '#8B4513' },
    STONE: { name: 'Stein', color: '#A9A9A9' },
    IRON: { name: 'Jern', color: '#C0C0C0' }
};

const recipes = [
    { input: ['WOOD', 'WOOD'], output: 'STONE' },
    { input: ['STONE', 'STONE'], output: 'IRON' }
];

function generateTerrain() {
    for (let x = 0; x < canvas.width; x += tileSize) {
        const height = Math.floor(Math.random() * (canvas.height / 2)) + canvas.height / 2;
        for (let y = height; y < canvas.height; y += tileSize) {
            const type = y === height ? terrainTypes.GRASS :
                         y < height + 3 * tileSize ? terrainTypes.DIRT :
                         terrainTypes.STONE;
            terrain.push({ x, y, type });
        }
    }
}

function drawTerrain() {
    terrain.forEach(tile => {
        ctx.fillStyle = tile.type.color;
        ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
    });
}

function drawPlayer() {
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function spawnEnemy() {
    const enemy = {
        x: Math.random() * canvas.width,
        y: 0,
        width: tileSize,
        height: tileSize,
        speed: 2,
        health: 50
    };
    enemies.push(enemy);
}

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        // Enkel AI: Beveg seg mot spilleren
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;

        // Sjekk kollisjon med spiller
        if (checkCollision(player, enemy)) {
            player.health -= 1;
            if (player.health <= 0) {
                alert('Game Over!');
                // Reset spillet her
            }
        }

        // Sjekk om fienden er drept
        if (enemy.health <= 0) {
            enemies.splice(index, 1);
            dropItem(enemy.x, enemy.y);
        }
    });
}

function drawEnemies() {
    ctx.fillStyle = '#FF00FF';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function dropItem(x, y) {
    const itemType = Object.values(itemTypes)[Math.floor(Math.random() * Object.values(itemTypes).length)];
    items.push({ x, y, type: itemType });
}

function drawItems() {
    items.forEach(item => {
        ctx.fillStyle = item.type.color;
        ctx.fillRect(item.x, item.y, tileSize / 2, tileSize / 2);
    });
}

function collectItems() {
    items.forEach((item, index) => {
        if (checkCollision(player, { x: item.x, y: item.y, width: tileSize / 2, height: tileSize / 2 })) {
            player.inventory.push(item.type);
            items.splice(index, 1);
        }
    });
}

function drawInventory() {
    const inventoryContainer = document.getElementById('inventory');
    inventoryContainer.innerHTML = '';
    player.inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = `inventory-slot${index === player.selectedItem ? ' selected' : ''}`;
        slot.style.backgroundColor = item.color;
        inventoryContainer.appendChild(slot);
    });
}

function craft() {
    const selectedItems = player.inventory.slice(player.selectedItem, player.selectedItem + 2);
    const recipe = recipes.find(r => 
        r.input.every(i => selectedItems.some(s => s.name === itemTypes[i].name))
    );
    
    if (recipe) {
        player.inventory.splice(player.selectedItem, 2);
        player.inventory.push(itemTypes[recipe.output]);
    }
}

function update() {
    // Horisontal bevegelse
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
    }

    // Gravitasjon og hopping
    player.velocityY += gravity;
    player.y += player.velocityY;

    // Sjekk kollisjon med bakken
    const groundLevel = canvas.height - player.height;
    if (player.y > groundLevel) {
        player.y = groundLevel;
        player.velocityY = 0;
        player.jumping = false;
    }

    // Graving og plassering av blokker
    if (keys['KeyE']) {
        const tileX = Math.floor(player.x / tileSize);
        const tileY = Math.floor((player.y + player.height) / tileSize);
        const index = terrain.findIndex(t => t.x === tileX * tileSize && t.y === tileY * tileSize);
        if (index !== -1) {
            terrain.splice(index, 1);
        }
    }
    if (keys['KeyQ']) {
        const tileX = Math.floor(player.x / tileSize);
        const tileY = Math.floor((player.y + player.height) / tileSize);
        if (!terrain.some(t => t.x === tileX * tileSize && t.y === tileY * tileSize)) {
            terrain.push({ x: tileX * tileSize, y: tileY * tileSize, type: terrainTypes.DIRT });
        }
    }

    updateEnemies();
    collectItems();

    if (keys['KeyC']) {
        craft();
    }
}

function updateHealthBar() {
    const healthBar = document.getElementById('health-bar');
    healthBar.style.width = `${player.health}%`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTerrain();
    drawPlayer();
    drawEnemies();
    drawItems();
    drawInventory();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

generateTerrain();
setInterval(spawnEnemy, 5000); // Spawn en fiende hvert 5. sekund
gameLoop();

// Legg til lyttere for tastaturkontroller
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && !player.jumping) {
        player.velocityY = jumpStrength;
        player.jumping = true;
    }
    if (e.code === 'KeyF') {
        // Angrip nærmeste fiende
        const nearestEnemy = enemies.reduce((nearest, enemy) => {
            const distance = Math.sqrt(Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2));
            return distance < nearest.distance ? { enemy, distance } : nearest;
        }, { enemy: null, distance: Infinity }).enemy;

        if (nearestEnemy && Math.abs(player.x - nearestEnemy.x) < 50 && Math.abs(player.y - nearestEnemy.y) < 50) {
            nearestEnemy.health -= 10;
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Legg til museklikk for å grave og plassere blokker
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const tileX = Math.floor(mouseX / tileSize) * tileSize;
    const tileY = Math.floor(mouseY / tileSize) * tileSize;

    if (e.button === 0) { // Venstre museklikk for å grave
        const index = terrain.findIndex(t => t.x === tileX && t.y === tileY);
        if (index !== -1) {
            terrain.splice(index, 1);
        }
    } else if (e.button === 2) { // Høyre museklikk for å plassere
        if (!terrain.some(t => t.x === tileX && t.y === tileY)) {
            terrain.push({ x: tileX, y: tileY, type: terrainTypes.DIRT });
        }
    }
});

// Forhindre kontekstmeny ved høyreklikk
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('wheel', (e) => {
    player.selectedItem = (player.selectedItem + (e.deltaY > 0 ? 1 : -1) + player.inventory.length) % player.inventory.length;
});
