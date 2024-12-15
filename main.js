import * as THREE from "three";

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  0.1,
  300
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cellSize = 20; // Размер клетки 50px
const columns = Math.ceil(window.innerWidth / cellSize); // Количество клеток по ширине
const rows = Math.ceil(window.innerHeight / cellSize); // Количество клеток по высоте

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const cameraSpeed = 0.5; // Adjust the speed of the camera movement
const boundaryThreshold = 0.3; // Defines the boundary range (10% of the canvas)

let controlPlane = null;
const tiles = [];

// Создаем матрицу клеток
for (let i = 0; i < rows; i++) {
  for (let j = 0; j < columns; j++) {
    const x = j * cellSize - (columns * cellSize) / 2 + cellSize / 2;
    const y = -(i * cellSize - (rows * cellSize) / 2 + cellSize / 2);

    // Создаем клетку
    const planeGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0077ff,
      side: THREE.DoubleSide,
    });

    if (i === 33 && j === 33) {
      continue;
    }

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.set(x, y, 0); // Расставляем клетки
    plane.name = `cell-${i}-${j}`;
    // scene.add(plane);

    // Создаем границу для клетки
    const borderGeometry = new THREE.EdgesGeometry(planeGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x002210,
      linewidth: 1,
      linejoin: "round",
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.set(x, y, 0.01); // Смещаем немного по Z, чтобы избежать z-fighting
    scene.add(border);
  }
}

// Main
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(cellSize, cellSize),
  new THREE.MeshBasicMaterial({
    color: "green",
    side: THREE.DoubleSide,
  })
);
const row = 33;
const column = 33;

const x = column * cellSize - (columns * cellSize) / 2 + cellSize / 2;
const y = -(row * cellSize - (rows * cellSize) / 2 + cellSize / 2);

plane.position.set(x, y, 0); // Расставляем клетки
plane.name = `cell-${33}-${33}`;

scene.add(plane);

// Настраиваем камеру
camera.position.z = 15; // Поднимаем камеру выше
camera.lookAt(0, 0, 0);

// Изменение размера окна
// window.addEventListener("resize", () => {
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   camera.left = window.innerWidth / -2;
//   camera.right = window.innerWidth / 2;
//   camera.top = window.innerHeight / 2;
//   camera.bottom = window.innerHeight / -2;
//   camera.updateProjectionMatrix();
// });

// Обработчик событий клавиатуры
window.addEventListener("keydown", (event) => {
  const selectedTile = scene.getObjectByName("cell-33-33");

  if (!selectedTile) return;

  const { position } = selectedTile;
  if (event.key === "ArrowUp") {
    position.y += cellSize;
  } else if (event.key === "ArrowDown") {
    position.y -= cellSize;
  } else if (event.key === "ArrowLeft") {
    position.x -= cellSize;
  } else if (event.key === "ArrowRight") {
    position.x += cellSize;
  }

  // Ограничения по границам
  position.x = Math.min(
    ((columns - 1) * cellSize) / 2,
    Math.max(-((columns - 1) * cellSize) / 2, position.x)
  );
  position.y = Math.min(
    ((rows - 1) * cellSize) / 2,
    Math.max(-((rows - 1) * cellSize) / 2, position.y)
  );
});

async function moveMainCellTo(rowFinish, columnFinish) {
  const selectedTile = scene.getObjectByName("cell-33-33");

  // Определяем индекс ячейки

  while (true) {
    const x = selectedTile.position.x + (columns * cellSize) / 2;
    const y = -(selectedTile.position.y - (rows * cellSize) / 2);
    const xcolumn = Math.floor(x / cellSize);
    const xrow = Math.floor(y / cellSize);

    console.log({
      start: `${row}:${xcolumn}`,
      finish: `${rowFinish}:${columnFinish}`,
    });

    if (xcolumn > columnFinish) {
      // selectedTile.position.x -= cellSize;
      selectedTile.position.setX(selectedTile.position.x - cellSize);
    } else if (xcolumn < columnFinish) {
      selectedTile.position.x += cellSize;
    } else if (xrow > rowFinish) {
      selectedTile.position.y += cellSize;
    } else if (xrow < rowFinish) {
      selectedTile.position.y -= cellSize;
    } else {
      break;
    }

    await sleep(500);

    if (row === rowFinish && column === columnFinish) {
      break;
    }
  }

  console.log("Finished moving");

  // for (let i = 0; i < rows; i++) {
  //   for (let j = 0; j < columns; j++) {
  //     const tile = scene.getObjectByName(`cell-${i}-${j}`);
  //     if (tile) {
  //       tile.position.set(
  //         j * cellSize - (columns * cellSize) / 2 + cellSize / 2,
  //         -(i * cellSize - (rows * cellSize) / 2 + cellSize / 2),
  //         0
  //       );
  //     }
  //   }
  // }
}

// Обработчик клика
window.addEventListener("click", (event) => {
  // Преобразование координат мыши в нормализованную систему
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Лучи от камеры
  raycaster.setFromCamera(mouse, camera);

  // Создаем плоскость, на которую проецируем луч
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Z=0
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersection);

  console.log(intersection);

  // Определяем индекс ячейки
  const x = intersection.x + (columns * cellSize) / 2;
  const y = -(intersection.y - (rows * cellSize) / 2);

  const column = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);

  if (row >= 0 && row < rows && column >= 0 && column < columns) {
    console.log(`Selected cell: row=${row}, column=${column}`);
    moveMainCellTo(row, column);
  } else {
    console.log("Clicked outside the grid");
  }
});

// Handle mouse move event
window.addEventListener("mousemove", (event) => {
  // Normalize mouse coordinates to range [-1, 1]
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Check if mouse is near any of the boundaries
  if (mouse.x > 1 - boundaryThreshold) {
    // Mouse is near the right edge
    camera.position.x += cameraSpeed;
  } else if (mouse.x < -1 + boundaryThreshold) {
    // Mouse is near the left edge
    camera.position.x -= cameraSpeed;
  }

  if (mouse.y > 1 - boundaryThreshold) {
    // Mouse is near the top edge
    camera.position.y += cameraSpeed;
  } else if (mouse.y < -1 + boundaryThreshold) {
    // Mouse is near the bottom edge
    camera.position.y -= cameraSpeed;
  }

  console.log(mouse.x, mouse.y, camera.position);

  // Prevent the camera from going out of bounds
  camera.position.x = Math.max(-5, Math.min(5, camera.position.x));
  camera.position.y = Math.max(-5, Math.min(5, camera.position.y));
});

// Handle mouse move event
window.addEventListener("mousewheel", (event) => {
  if (event.deltaY < 0) {
    camera.zoom += 0.1; // Zoom in
  } else {
    camera.zoom -= 0.1; // Zoom out
  }

  // Clamp zoom level to prevent extreme values
  camera.zoom = Math.max(0.5, Math.min(3, camera.zoom));

  // Apply the zoom change
  camera.updateProjectionMatrix();
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Анимация и рендер
async function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
