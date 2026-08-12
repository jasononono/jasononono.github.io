document.getElementById("aboutme-button").addEventListener("click", function() {
    document.getElementById("aboutme").scrollIntoView({behavior: "smooth", block: "start"});
})
document.getElementById("projects-button").addEventListener("click", function() {
    document.getElementById("projects").scrollIntoView({behavior: "smooth", block: "start"});
})
document.getElementById("links-button").addEventListener("click", function() {
    document.getElementById("links").scrollIntoView({behavior: "smooth", block: "start"});
})

var project_banner = document.getElementsByClassName("project-banner")

for (let i = 0; i < project_banner.length; i++) {
    project_banner[i].addEventListener("click", function() {
        this.classList.toggle("active");
        let project_main = this.nextElementSibling;
        project_main.classList.toggle("active");
        if (project_main.style.maxHeight){
          project_main.style.maxHeight = null;
        } else {
          project_main.style.maxHeight = project_main.scrollHeight + "px";
        }
    })
}


var num_grid = document.getElementById("num-grid");
var nums = new Array();
var links_bg = document.getElementById("links-bg")
var min_size = 50;
var max_rows = 50;
var grid_columns = 20;
var grid_height, grid_rows;
let size;

var fade_intensity = 100;
var fade_idx = new Array(grid_columns);
for (let i = 0; i < grid_columns; i++) {
    fade_idx[i] = (Math.random() + 1) * fade_intensity;
}
var resize_tick = 0;
var resize_timer = 0;

var mouse_x = Infinity, mouse_y = Infinity;
var mouse_state = false;
var light_radius = 200;
var light_tick = 0;
var light_hide = 0;
let dist, dx, dy, brightness;
var num_state = new Array();

for (let i = 0; i < max_rows; i++) {
    nums.push(new Array());
    num_state.push(new Array());
    for (let j = 0; j < grid_columns; j++) {
        var num = document.createElement("div");
        num.className = "num";
        num.style.gridRow = i + 1;
        num.style.gridColumn = j + 1;
        num.textContent = num_rand();
        num_grid.appendChild(num);
        nums[i].push(num);
        num_state[i].push(false);
    }
}

function num_rand(i, j) {
    return Math.random().toFixed(2);
}

function grid_resize() {
    size = Math.max(min_size, window.innerWidth / grid_columns);
    grid_height = Math.min(max_rows, (document.documentElement.scrollHeight - links_bg.scrollHeight) / size - 1);
    grid_rows = Math.floor(grid_height);

    for (let i = 0; i < grid_rows; i++) {
        for (let j = 0; j < grid_columns; j++) {
            nums[i][j].style.width = size + "px";
            nums[i][j].style.height = size + "px";
            nums[i][j].style.display = "flex"
            nums[i][j].style.opacity = 1 - resize_tick / 20 * Math.max(0, i * size - window.innerHeight / 5) / size / 8;
        }
    }
    for (let i = grid_rows; i < max_rows; i++) {
        for (let j = 0; j < grid_columns; j++) {
            nums[i][j].style.display = "none";
        }
    }

    for (let i = 0; i < grid_rows; i++) {
        for (let j = 0; j < grid_columns; j++) {
            dx = (num_grid.offsetLeft - num_grid.offsetWidth / 2) + (j + 0.5) * size
            dy = num_grid.offsetTop + (i + 0.5) * size
            dist = Math.hypot(mouse_x - dx, mouse_y - dy);
            dist = Math.max(0, light_radius - dist);
            brightness = dist / light_radius * 20 * light_hide / 10;
            nums[i][j].style.color = `hsl(208, 15%, ${20 + brightness}%)`;
            if (!num_state[i][j] && brightness > 10) {
                num_state[i][j] = true;
                nums[i][j].textContent = num_rand();
            } else if (num_state[i][j] && brightness < 10) {
                num_state[i][j] = false;
            }
        }
    }

    for (let i = 0; i < grid_columns; i++) {
        let r = grid_rows - 1;
        let opacity;
        while ((grid_height - 1 - r) * size < fade_idx[i]) {
            opacity = 1 - (fade_idx[i] - (grid_height - 1 - r) * size) / fade_intensity;
            nums[r][i].style.opacity = Math.min(nums[r][i].style.opacity, Math.max(0, opacity));
            r -= 1;
        }
    }
}


class Node {
    constructor(e, x, y) {
        this.e = e;
        this.x = x;
        this.y = y;
    }
}

class Edge {
    constructor(e, u, v) {
        this.e = e;
        this.u = u;
        this.v = v;
    }
}


var node_count = 10;
var edge_count = 10;
var pre_updates = 50;
var repulsion = 500000;
var stiffness = 0.6;
var tension = 100;
var friction = 0.4;
var stretch_force = 0.1;
var dsq_clamp = 400;
var force_clamp = 2000;
var wheel_force = 5;
var wheel_max_force = 200;
var epsilon = 0.0001;
var gravity = 2;

var graph_sim = document.getElementById("graph-sim");
var graph_edges = document.getElementById("graph-edges")
var edges = []
var nodes = []
var time = 0;
var cx, cy;

let net_x = new Array(node_count);
let net_y = new Array(node_count);
let scroll_force = new Array(node_count).fill(0);
let dsq, magnitude, force, angle, force_x, force_y;

let dragged = null;
let drag_x = 0;
let drag_y = 0;
var mouse_drag_x = 0, mouse_drag_y = 0;
let idx;
let block_scroll = false;
let scroll = 0;

sim_resize();

for (let i = 0; i < node_count; i++) {
    let node = document.createElement("div");
    node.className = "graph-node";
    node.style.display = "block";
    graph_sim.appendChild(node);
    node.addEventListener("pointerdown", mouse_down);

    let x = Math.floor(Math.random() * (graph_sim.offsetWidth - 40) + 20);
    let y = Math.floor(Math.random() * (graph_sim.offsetHeight - 40) + 20);

    nodes.push(new Node(node, x, y));
}

for (let i = 0; i < edge_count; i++) {
    let edge = document.createElementNS("http://www.w3.org/2000/svg", "line");
    edge.setAttribute("class", "graph-edge");
    graph_edges.appendChild(edge);

    let u = Math.floor(Math.random() * node_count);
    let v = Math.floor(Math.random() * node_count);

    edges.push(new Edge(edge, u, v));
}

for (let i = 0; i < pre_updates; i++) {
    update(0.1);
}


function sim_resize() {
    cx = graph_sim.offsetWidth / 2;
    cy = graph_sim.offsetHeight / 2;
    if (scroll != 0) {
        cy += Math.log(Math.abs(scroll)) * wheel_force * Math.sign(scroll);
    }
}

function mouse_down(event) {
    idx = nodes.findIndex(node => node.e === event.target);
    if (idx < 0) {return;}
    dragged = nodes[idx];
    drag_x = dragged.x;
    drag_y = dragged.y;
    mouse_drag_x = event.pageX;
    mouse_drag_y = event.pageY;
    event.preventDefault();
}

function mouse_down_generic(event) {
    mouse_x = event.pageX;
    mouse_y = event.pageY;
}

function mouse_move(event) {
    mouse_x = event.pageX;
    mouse_y = event.pageY
    if (!dragged) {return;}
    dragged.x = mouse_x - mouse_drag_x + drag_x;
    dragged.y = mouse_y - mouse_drag_y + drag_y;
    event.preventDefault();
}

function mouse_leave(event) {
    if (mouse_state && !event.relatedTarget && event.toElement === null) {
        light_tick = 10;
        mouse_state = false;
    }
}

function mouse_enter(event) 
{
    if (!mouse_state) {
        light_tick = -10;
        mouse_state = true;
    }
}

function mouse_up(event) {
    dragged = null;
}

var last_scroll = window.scrollY;

function mouse_scroll(event) {
    scroll = -event.deltaY
    if (block_scroll) {return;}
    if (scroll == 0) {return;}

    let avg = 0;
    for (let i = 0; i < node_count; i++) {
        avg += nodes[i].y;
    } avg /= node_count;

    for (let i = 0; i < node_count; i++) {
        force = (nodes[i].y - avg) * stretch_force * Math.abs(scroll) + scroll * wheel_force * 2;
        force = Math.sign(force) * Math.min(Math.abs(force), wheel_max_force);
        if (scroll_force[i] == 0 || Math.sign(scroll_force[i]) != Math.sign(force) || Math.abs(force) > Math.abs(scroll_force[i])) {
            scroll_force[i] = force;
        }
    }
}

function window_resize(event) {
    resize_timer = 20;
}

function window_unload(event) {
    light_hide = 0;
    mouse_state = false;
}

window.addEventListener("pointerdown", mouse_down_generic);
window.addEventListener("pointermove", mouse_move);
window.addEventListener("pointerup", mouse_up);
window.addEventListener("pointercancel", mouse_up);
window.addEventListener("wheel", mouse_scroll);
window.addEventListener("resize", window_resize);
window.addEventListener("mouseout", mouse_leave);
window.addEventListener("mouseover", mouse_enter);
window.addEventListener("blur", window_unload);
window.addEventListener("visibilitychange", window_unload);

let fps_target = 1000 / 120;
let last_time = 0;

function frame(currentTime) {
    if (currentTime - last_time >= fps_target) {
        let dt = (currentTime - last_time) / 1000;
        last_time = currentTime;
        sim_resize();
        grid_resize();
        update(dt);
        render(dt);
    }
    requestAnimationFrame(frame);
}

function update(dt) {
    net_x.fill(0);
    net_y.fill(0);

    // vertex repulsion
    for (let i = 0; i < node_count; i++) {
        for (let j = 0; j < node_count; j++) {
            if (i == j) {continue;}
            dsq = (nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2;
            dsq = Math.max(dsq, epsilon);
            dist = Math.max(Math.sqrt(dsq), epsilon);
            
            magnitude = Math.min(repulsion / Math.max(dsq, dsq_clamp), force_clamp);
            net_x[i] += magnitude * (nodes[i].x - nodes[j].x) / dist;
            net_y[i] += magnitude * (nodes[i].y - nodes[j].y) / dist;
        }
    }

    // central gravity
    for (let i = 0; i < node_count; i++) {
        dsq = (nodes[i].x - cx) ** 2 + (nodes[i].y - cy) ** 2;
        dist = Math.max(Math.sqrt(dsq), epsilon);
        net_x[i] += gravity * (cx - nodes[i].x);
        net_y[i] += gravity * (cy - nodes[i].y);
    }

    // spring tension
    for (let i = 0; i < edge_count; i++) {
        dx = nodes[edges[i].v].x - nodes[edges[i].u].x;
        dy = nodes[edges[i].v].y - nodes[edges[i].u].y;
        dist = Math.max(Math.sqrt(dx ** 2 + dy ** 2), epsilon);

        magnitude = stiffness * (dist - tension);
        force_x = magnitude * dx / dist;
        force_y = magnitude * dy / dist;

        net_x[edges[i].u] += force_x;
        net_y[edges[i].u] += force_y;
        net_x[edges[i].v] -= force_x;
        net_y[edges[i].v] -= force_y;
    }

    // update positions
    for (let i = 0; i < node_count; i++) {
        if (nodes[i] === dragged) {continue;}
        net_y[i] += scroll_force[i];
        scroll_force[i] *= friction ** dt;
        nodes[i].x += net_x[i] * dt;
        nodes[i].y += net_y[i] * dt;
    }
    block_scroll = (window.innerHeight + window.pageYOffset) >= document.body.offsetHeight;
    scroll = 0;

    if (resize_timer > 0) {
        resize_tick = Math.min(resize_tick + 1, 20);
        resize_timer -= 1;
    } else {
        resize_tick = Math.max(resize_tick - 1, 0);
    }
    if (light_tick > 0) {
        light_tick -= 1;
        light_hide -= 1;
    } else if (light_tick < 0) {
        light_tick += 1
        light_hide += 1;
    }
    if (light_hide > 10 || light_hide < 0) {
        if (mouse_state) {
            light_hide = 10;
        } else {
            light_hide = 0;
        }
    }
}

function render(dt) {
    for (let i = 0; i < node_count; i++) {
        nodes[i].e.style.translate = `${nodes[i].x - 20}px ${nodes[i].y - 20}px`;
    }

    let x1m = Infinity, y1m = Infinity, x2m = -Infinity, y2m = -Infinity;
    for (let i = 0; i < edge_count; i++) {
        x1m = Math.min(x1m, nodes[edges[i].u].x, nodes[edges[i].v].x);
        y1m = Math.min(y1m, nodes[edges[i].u].y, nodes[edges[i].v].y);
        x2m = Math.max(x2m, nodes[edges[i].u].x, nodes[edges[i].v].x);
        y2m = Math.max(y2m, nodes[edges[i].u].y, nodes[edges[i].v].y);
    }
    graph_edges.style.width = x2m - x1m;
    graph_edges.style.height = y2m - y1m;
    graph_edges.style.left = x1m;
    graph_edges.style.top = y1m;

    for (let i = 0; i < edge_count; i++) {
        edges[i].e.setAttribute("x1", nodes[edges[i].u].x - x1m);
        edges[i].e.setAttribute("y1", nodes[edges[i].u].y - y1m);
        edges[i].e.setAttribute("x2", nodes[edges[i].v].x - x1m);
        edges[i].e.setAttribute("y2", nodes[edges[i].v].y - y1m);
    }
}


requestAnimationFrame(frame);