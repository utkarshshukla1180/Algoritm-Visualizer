var algoselected = false;
const modalalgo = document.getElementById('algobtntext');
const modelMaze = document.getElementById('mazebtntext');
const modalspeed = document.getElementById('speedbtntext');
const modalclear = document.getElementById('btnclearswalls');
const dropDownAlgo = document.getElementsByClassName('algodropdownContent')[0];
const dropDownspeed = document.getElementsByClassName('speeddropdownContent')[0];
const gridTable = document.getElementById('gridTable');
const tableWrap = document.getElementsByClassName('table-wrap')[0];
const bv = document.getElementById('boxVisited');
var textP = document.getElementById('textP');
var pn = document.getElementById('pn');
var textV = document.getElementById('textV');
var algoName = document.getElementById('algoName');
var algoDesc = document.getElementById('algoDesc');
var pv = document.getElementById('pathVisited');
var ListOfNodes = [];
var nodeIndex = new Map();
var nodes = [];
var visiteds = [];
var vis = [];
var path = [];
var viz = false;
var start;
var end;
var count = 0;
var CELL = 25;
var WIDTH = 50;
var HEIGHT = 30;
var speed = 5;
var mouseclicked = false;
var startDrag = false;
var endDrag = false;
var rightpressed = false;
var previousStart;
var previousEnd;
let curr;
var pps = 'unv';
var ppe = 'unv';
var visualizing = false;
var listM = [];
var resizeTimer;
const DEFAULT_DESC = 'Path Finder visualizes how different path finding algorithms search a grid';

class QElement {
    constructor(element, priority) {
        this.element = element;
        this.priority = priority;
    }
}

class PriorityQueue {
    constructor() {
        this.items = [];
    }
    enqueue(element, priority) {
        var qElement = new QElement(element, priority);
        this.items.unshift(qElement);
    }
    dequeue() {
        if (this.isEmpty())
            return "Underflow";
        this.sort();
        return this.items.shift();
    }
    isEmpty() {
        if (this.items.length <= 0)
            return true;
        return false;
    }
    sort() {
        var i, j;
        for (i = 0; i < this.items.length - 1; i++)
            for (j = 0; j < this.items.length - i - 1; j++)
                if (this.items[j].priority > this.items[j + 1].priority) {
                    let temp = this.items[j];
                    this.items[j] = this.items[j + 1];
                    this.items[j + 1] = temp;
                }
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeIcon').className = theme === 'dark' ? 'fa fa-sun-o' : 'fa fa-moon-o';
    document.getElementById('themeLabel').textContent = theme === 'dark' ? 'Light' : 'Dark';
    try {
        localStorage.setItem('pf-theme', theme);
    } catch (e) { }
}

function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
}

function initTheme() {
    let saved = null;
    try {
        saved = localStorage.getItem('pf-theme');
    } catch (e) { }
    if (!saved)
        saved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved);
}

function computeDims() {
    const w = tableWrap.clientWidth;
    const h = tableWrap.clientHeight;
    WIDTH = Math.max(12, Math.floor(w / CELL));
    HEIGHT = Math.max(8, Math.floor(h / CELL));
}

function buildGrid() {
    computeDims();
    make_Grid();
    previousStart = document.getElementsByClassName('start')[0];
    previousEnd = document.getElementsByClassName('end')[0];
    pps = 'unv';
    ppe = 'unv';
    ListOfNodes.length = 0;
    visiteds.length = 0;
    vis.length = 0;
    path.length = 0;
    listM.length = 0;
    nodes.length = 0;
    count = 0;
    visualizing = false;
    viz = false;
    textV.innerText = 0;
    textP.innerText = 0;
    document.getElementsByClassName('box')[0].style.display = 'none';
}

initTheme();
document.documentElement.style.setProperty('--cell', CELL + 'px');

window.onload = () => {
    buildGrid();
    modalalgo.style.pointerEvents = 'none';
    modelMaze.style.pointerEvents = 'none';
    modalclear.style.pointerEvents = 'none';
    modalspeed.style.pointerEvents = 'none';
    gridTable.style.pointerEvents = 'none';
};

window.addEventListener('resize', () => {
    if (viz)
        return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const oldW = WIDTH;
        const oldH = HEIGHT;
        computeDims();
        if (oldW !== WIDTH || oldH !== HEIGHT) {
            buildGrid();
            algoDesc.textContent = DEFAULT_DESC;
            algoDesc.style.color = '';
        }
    }, 200);
});

gridTable.onmousedown = (event) => {
    if (event.button == 2) {
        rightpressed = true;
    }
    if (!mouseclicked && !(event.target.className.includes("start") || event.target.className.includes("end")))
        mouseclicked = true;
    else {
        mouseclicked = false;
        if (event.target.className == 'start')
            startDrag = true;
        else
            endDrag = true;
    }
};

gridTable.onmouseup = () => {
    if (rightpressed)
        rightpressed = false;
    if (mouseclicked)
        mouseclicked = false;
    else if (startDrag || endDrag)
        startDrag = false;
    endDrag = false;
};

gridTable.onmousemove = (event) => {
    event.stopPropagation();

    if (rightpressed && event.target.className == "wall") {
        event.preventDefault();
        event.target.classList.remove("wall");
        event.target.classList.add("unv");
    }
    if (!rightpressed && mouseclicked &&
        !(event.target.tagName == "TBODY" || event.target.tagName == "TABLE" ||
            event.target.tagName == "TR" || event.target.className == "start" || event.target.className == "end")) {
        let p = event.target;
        p.classList.remove("unv");
        p.classList.add("wall");
    } else if (!(event.target.tagName == "TABLE")) {
        if (startDrag) {
            curr = event.target;
            previousStart.classList.remove("start");
            previousStart.classList.add(pps);
            curr.classList.remove("unv");
            if (event.target.className == "end") {
                curr.classList.remove("end");
                curr.classList.add("start");
                previousEnd.classList.remove("end");
                previousEnd.classList.add("unv");
                previousEnd = previousStart;
                previousEnd.classList.remove("unv");
                previousEnd.classList.remove("start");
                previousEnd.classList.add("end");
                previousStart = event.target;
                return;
            }
            if (event.target.className == 'wall') {
                pps = "wall";
                curr.classList.remove("wall");
            } else {
                pps = "unv";
            }
            curr.classList.add("start");
            previousStart = event.target;
        }
        else if (endDrag) {
            let curr = event.target;
            previousEnd.classList.remove("end");
            previousEnd.classList.add(ppe);
            curr.classList.remove("unv");
            if (event.target.className == "start") {
                curr.classList.remove("start");
                curr.classList.add("end");
                previousStart.classList.remove("start");
                previousStart.classList.add("unv");
                previousStart = previousEnd;
                previousStart.classList.remove("unv");
                previousStart.classList.remove("end");
                previousStart.classList.add("start");
                previousEnd = event.target;
                return;
            }
            if (event.target.className == "wall") {
                ppe = "wall";
                curr.classList.remove("wall");
            } else {
                ppe = "unv";
            }
            curr.classList.add("end");
            previousEnd = event.target;
        }
    }
};

function clearAll() {
    if (!viz) {
        algoDesc.textContent = DEFAULT_DESC;
        algoDesc.style.color = '';
        document.getElementsByClassName('box')[0].style.display = 'none';

        gridTable.style.pointerEvents = 'all';
        startDrag = false;
        endDrag = false;
        visualizing = false;
        ListOfNodes.forEach(element => {
            if (element.visited && element.id != start) {
                document.getElementById(end).classList.remove('shortestPath');
                document.getElementById(element.id).classList.remove('visited');
                document.getElementById(element.id).classList.remove('shortestPath');
                document.getElementById(element.id).classList.add('unv');
            } else if (element.wall && element.id != start) {
                document.getElementById(element.id).classList.remove('wall');
                document.getElementById(element.id).classList.add('unv');
            } else {
                document.getElementById(start).classList.remove('shortestPath');
                document.getElementById(element.id).classList.remove('visited');
            }
        });

        Array.from(document.getElementsByClassName('wall')).forEach(element => {
            element.classList.remove('wall');
            element.classList.add('unv');
        });

        ListOfNodes.length = 0;
        visiteds.length = 0;
        vis.length = 0;
        path.length = 0;
        listM.length = 0;
        textV.innerText = 0;
        textP.innerText = 0;
    }
}

function clearPath() {
    if (!viz) {
        algoDesc.textContent = DEFAULT_DESC;
        algoDesc.style.color = '';
        document.getElementsByClassName('box')[0].style.display = 'none';
    }
    if (ListOfNodes.length > 0 && !viz) {
        gridTable.style.pointerEvents = 'all';
        visualizing = false;
        ListOfNodes.forEach(element => {
            if (element.visited && element.id != start) {
                document.getElementById(end).classList.remove('shortestPath');
                document.getElementById(element.id).classList.remove('visited');
                document.getElementById(element.id).classList.remove('shortestPath');
                document.getElementById(element.id).classList.add('unv');
            } else {
                document.getElementById(start).classList.remove('shortestPath');
            }
        });
        vis.length = 0;
        path.length = 0;
        textV.innerText = 0;
        textP.innerText = 0;
    }
}

function make_Grid() {
    const midRow = Math.floor(HEIGHT / 2);
    const startCol = Math.max(1, Math.floor(WIDTH * 0.25));
    const endCol = Math.min(WIDTH - 2, Math.floor(WIDTH * 0.75));
    let cR = "";
    for (var i = 0; i < HEIGHT; i++) {
        cR += "<tr id='row-" + i + "'>";
        for (var k = 0; k < WIDTH; k++) {
            let cls = 'unv';
            if (i == midRow && k == startCol)
                cls = 'start';
            else if (i == midRow && k == endCol)
                cls = 'end';
            cR += "<td id='" + i + "-" + k + "' draggable='false' onclick='createWall(event)' class='" + cls + "'></td>";
        }
        cR += "</tr>";
    }
    gridTable.innerHTML = cR;
}

function createWall(event) {
    event.stopPropagation();
    let cn = event.target;
    if (!cn.id.includes("row") && !(cn.className.includes("start") || cn.className.includes("end"))) {
        cn.classList.remove("unv");
        cn.classList.add("wall");
        nodes.push(cn.id);
    }
}

function changeAlgo(element) {
    modalalgo.textContent = element.textContent;
    algoName.textContent = element.textContent;
    algoselected = true;
    dropDownAlgo.style.display = 'none';
}

function changeSpeed(element) {
    modalspeed.textContent = element.textContent;
    dropDownspeed.style.display = 'none';
    if (element.textContent.includes('Super Fast'))
        speed = 1;
    if (element.textContent.includes('Fast'))
        speed = 10;
    if (element.textContent.includes('Medium'))
        speed = 75;
    if (element.textContent.includes('Slow'))
        speed = 550;
}

function closeDropDowns() {
    dropDownAlgo.style.display = 'none';
    dropDownspeed.style.display = 'none';
}

function DropDown(event) {
    if (event.target == modalalgo) {
        const open = dropDownAlgo.style.display == 'flex';
        closeDropDowns();
        dropDownAlgo.style.display = open ? 'none' : 'flex';
    }
    if (event.target == modalspeed) {
        const open = dropDownspeed.style.display == 'flex';
        closeDropDowns();
        dropDownspeed.style.display = open ? 'none' : 'flex';
    }
}

function closePopUp(element) {
    modalalgo.style.pointerEvents = 'all';
    modelMaze.style.pointerEvents = 'all';
    modalclear.style.pointerEvents = 'all';
    modalspeed.style.pointerEvents = 'all';
    gridTable.style.pointerEvents = 'all';
    element.parentNode.remove();
}

function visualize() {
    if (algoselected && !visualizing) {
        document.getElementsByClassName('box')[0].style.display = 'flex';
        pn.style.display = 'none';
        pv.style.display = 'none';
        textP.style.display = 'none';
        visualizing = true;
        viz = true;
        gridTable.style.pointerEvents = 'none';
        algoVis(algoName.textContent);
        toAnimate(vis, 0, path);
        algoDesc.textContent = "Visualizing " + algoName.textContent;
        algoDesc.style.color = "#27ae60";
    }
    else if (!algoselected && !visualizing) {
        algoDesc.textContent = "Select an algorithm to visualize";
        algoDesc.style.color = "#e74c3c";
    }
}

function algoVis(algo) {
    vis.length = 0;
    path.length = 0;
    if (algo.includes('Dijkstra')) {
        var node = dijkstra();
        vis = node[0];
        path = node[1];
    } if (algo.includes('Breadth First Search')) {
        var node = bredthFirstSearch();
        vis = node[0];
        path = node[1];
    } if (algo.includes('Best First Search')) {
        var node = bestFirstSearch();
        vis = node[0];
        path = node[1];
    } if (algo.includes('A *')) {
        var node = AStar();
        vis = node[0];
        path = node[1];
    }
    if (algo.includes("Depth First Search")) {
        var node = depthFirstSearch();
        vis = node[0];
        path = node[1];
    }
}

function getAllNodes(list) {
    let all = [];
    nodeIndex = new Map();
    for (let i = 0; i < list.length; i++) {
        let n = new _Node(list[i]);
        all.push(n);
        nodeIndex.set(n.id, n);
    }
    return all;
}

function getNodeById(id) {
    return nodeIndex.get(id);
}

function updateDistance(node, distance) {
    node.distance = distance;
    return node;
}

function _Node(node) {
    this.node = node;
    this.id = node.id;
    this.visited = false;
    this.distance = Infinity;
    this.wall = node.className == "wall" ? true : false;
    this.row = node.id.split('-')[0];
    this.col = node.id.split('-')[1];
    this.parent = null;
}

function getNeighboursForUnweighted(node) {
    let neighbours = [];
    let row = parseInt(node.row);
    let col = parseInt(node.col);
    neighbours.push(getNodeById(`${row + 1}-${col}`));
    neighbours.push(getNodeById(`${row - 1}-${col}`));
    neighbours.push(getNodeById(`${row}-${col - 1}`));
    neighbours.push(getNodeById(`${row}-${col + 1}`));
    return neighbours.filter((element) => {
        return element != undefined && !element.wall && !element.visited;
    });
}

function getNeighboursForGreedy(node) {
    return getNeighboursForUnweighted(node);
}

function findMinDistanceInGraph(graph) {
    let len = graph.length;
    let min = Infinity;
    while ((len--) != 0) {
        if (graph[len].distance < min)
            min = graph[len].distance;
    }
    return graph.find(element => element.distance == min);
}

function dijkstra() {
    let prev = [];
    let visited = [];

    start = document.getElementsByClassName("start")[0].id;
    end = document.getElementsByClassName("end")[0].id;

    let Unvnodes = document.getElementsByTagName('td');

    ListOfNodes = getAllNodes(Unvnodes);
    let temp = ListOfNodes;
    updateDistance(getNodeById(start), 0);
    var finished = null;

    while (temp.length != 0) {
        let current = findMinDistanceInGraph(temp);
        if (current.id == getNodeById(end).id) {
            finished = current;
            break;
        }
        if (current.distance == Infinity) break;

        visited.push(current);

        temp = temp.filter(ele => ele != current);

        current.visited = true;

        let neighbours = getNeighboursForUnweighted(current);

        for (var i in neighbours) {
            let distance = current.distance + 1;
            if (distance < neighbours[i].distance) {
                updateDistance(neighbours[i], distance);
                neighbours[i].parent = current;
            }
        }
    }
    while (finished != null) {
        prev.unshift(finished);
        finished = finished.parent;
    }
    return [visited, (prev.length > 0) ? prev : null];
}

function bredthFirstSearch() {
    let vis = [];
    let path = [];

    start = document.getElementsByClassName("start")[0].id;
    end = document.getElementsByClassName("end")[0].id;

    let Unvnodes = document.getElementsByTagName('td');

    ListOfNodes = getAllNodes(Unvnodes);

    let visited = [];

    let finished = null;
    visited.unshift(getNodeById(start));

    while (visited.length != 0) {
        let currentNode = visited.pop();
        currentNode.visited = true;

        if (currentNode.id == end) {
            finished = currentNode;
            break;
        }
        vis.push(currentNode);
        let neighbours = getNeighboursForUnweighted(currentNode);

        for (var i in neighbours) {
            neighbours[i].visited = true;
            neighbours[i].parent = currentNode;
            visited.unshift(neighbours[i]);
        }
    }
    while (finished != null) {
        path.unshift(finished);
        finished = finished.parent;
    }
    return [vis, path];
}

function bestFirstSearch() {
    let vis = [];
    let path = [];

    start = document.getElementsByClassName("start")[0].id;
    end = document.getElementsByClassName("end")[0].id;
    let Unvnodes = document.getElementsByTagName('td');

    ListOfNodes = getAllNodes(Unvnodes);

    let pq = new PriorityQueue();

    let Snode = getNodeById(start);
    pq.enqueue(Snode, Snode.distance);

    let endNode = getNodeById(end);
    let finished = null;

    while (!pq.isEmpty()) {
        let u = pq.dequeue();

        vis.push(u.element);

        u.element.visited = true;

        let neighbours = getNeighboursForGreedy(u.element);

        if (u.element.id == end) {
            finished = u.element;
            break;
        }
        for (var i in neighbours) {
            neighbours[i].visited = true;
            let distance = calculateSignleLineDistance(endNode, neighbours[i]);
            neighbours[i].distance = distance;
            neighbours[i].parent = u.element;
            pq.enqueue(neighbours[i], neighbours[i].distance);
        }
    }
    while (finished != null) {
        path.unshift(finished);
        finished = finished.parent;
    }
    return [vis, path];
}

function AStar() {
    let vis = [];
    let path = [];

    start = document.getElementsByClassName("start")[0].id;
    end = document.getElementsByClassName("end")[0].id;
    let Unvnodes = document.getElementsByTagName('td');

    ListOfNodes = getAllNodes(Unvnodes);

    let sNode = getNodeById(start);
    sNode.distance = 0;
    let enode = getNodeById(end);
    let pq = new PriorityQueue();
    pq.enqueue(sNode, 0);
    var finished = null;
    while (!pq.isEmpty()) {
        let u = pq.dequeue();
        u.element.visited = true;
        vis.push(u.element);
        if (u.element.id == end) {
            finished = u.element;
            break;
        }
        let neighbours = getNeighboursForGreedy(u.element);

        for (var i in neighbours) {
            let weight = u.element.distance + 1;
            let gN = weight;
            neighbours[i].distance = weight;
            let distance = calculateSignleLineDistance(enode, neighbours[i]) + gN;
            neighbours[i].parent = u.element;
            neighbours[i].visited = true;
            pq.enqueue(neighbours[i], distance);
        }
    }
    while (finished != null) {
        path.unshift(finished);
        finished = finished.parent;
    }
    return [vis, path];
}

function depthFirstSearch() {
    let vis = [];
    let path = [];
    start = document.getElementsByClassName("start")[0].id;
    end = document.getElementsByClassName("end")[0].id;
    let Unvnodes = document.getElementsByTagName("td");
    ListOfNodes = getAllNodes(Unvnodes);
    let startNode = getNodeById(start);
    let endNode = getNodeById(end);
    let found = dfsIterative(startNode, endNode, vis);
    if (found) {
        let currentNode = endNode;
        while (currentNode != null) {
            path.unshift(currentNode);
            currentNode = currentNode.parent;
        }
    }
    return [vis, path];
}

function dfsIterative(startNode, endNode, vis) {
    let stack = [startNode];
    while (stack.length > 0) {
        let currentNode = stack.pop();
        if (currentNode.visited)
            continue;
        currentNode.visited = true;
        vis.push(currentNode);
        if (currentNode.id == endNode.id)
            return true;
        let neighbours = getNeighboursForUnweighted(currentNode);
        for (let i = neighbours.length - 1; i >= 0; i--) {
            neighbours[i].parent = currentNode;
            stack.push(neighbours[i]);
        }
    }
    return false;
}

function calculateSignleLineDistance(Node1, Node2) {
    let x1 = parseInt(Node1.row);
    let y1 = parseInt(Node1.col);
    let x2 = parseInt(Node2.row);
    let y2 = parseInt(Node2.col);
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

function randomMaze() {
    if (listM.length > 0) {
        clearMaze(listM);
        listM.length = 0;
    }
    const listNodes = document.getElementsByClassName('unv');
    let len = listNodes.length - 1;

    for (var i = 0; i < len / 4; i++) {
        listM.push(listNodes[(Math.floor(Math.random() * len))].id);
    }
    Animation(listM);
}

function Animation(list) {
    for (let i = 0; i < list.length; i++) {
        let cell = document.getElementById(list[i]);
        cell.classList.remove("unv");
        cell.classList.add("wall");
    }
}

function clearMaze(list) {
    for (let i = 0; i < list.length; i++) {
        let cell = document.getElementById(list[i]);
        cell.classList.remove("wall");
        cell.classList.add("unv");
    }
}

function toAnimate(vis, i, prev) {
    document.getElementById(vis[i].id).classList.add("current");
    setTimeout(() => {
        if (i == vis.length - 1) {
            document.getElementById(vis[i].id).classList.remove('unv');
            document.getElementById(vis[i].id).classList.remove('current');
            document.getElementById(vis[i].id).classList.add('visited');
            visiteds.push(vis[i].id);
            textV.innerText = count;
            pn.style.display = 'block';
            pv.style.display = 'block';
            textP.style.display = 'block';
            count = 0;
            toAnimateP(prev, 0);
            return;
        }
        document.getElementById(vis[i].id).classList.remove('unv');
        document.getElementById(vis[i].id).classList.remove('current');
        document.getElementById(vis[i].id).classList.add('visited');
        textV.innerText = count;
        count++;
        visiteds.push(vis[i].id);
        toAnimate(vis, i + 1, prev);
    }, speed);
}

function toAnimateP(prev, i) {
    if (prev == null) {
        viz = false;
        count = 0;
        return;
    }
    setTimeout(() => {
        if (i == prev.length) {
            viz = false;
            count = 0;
            return;
        }
        document.getElementById(prev[i].id).classList.remove("visited");
        document.getElementById(prev[i].id).classList.add("shortestPath");
        textP.innerText = count;
        count++;
        toAnimateP(prev, i + 1);
    }, 30);
}