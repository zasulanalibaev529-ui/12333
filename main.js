
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#0f172a",
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);

let currentLevel = loadProgress();
let combo = 0;
let comboTimer = null;

function saveProgress(level){
    localStorage.setItem("mathjong_level", level);
}

function loadProgress(){
    return parseInt(localStorage.getItem("mathjong_level")) || 1;
}

function MenuScene(){
    Phaser.Scene.call(this, { key: "MenuScene" });
}
MenuScene.prototype = Object.create(Phaser.Scene.prototype);

MenuScene.prototype.create = function(){
    this.add.text(config.width/2, 120, "MATHJONG BLAST", {fontSize:"40px", fill:"#38bdf8"}).setOrigin(0.5);

    for(let i=1;i<=10;i++){
        let btn = this.add.text(config.width/2, 200+i*40, "Level "+i, 
            {fontSize:"24px", backgroundColor:"#1e293b", padding:10})
            .setOrigin(0.5)
            .setInteractive();

        btn.on("pointerdown", ()=>{
            currentLevel = i;
            this.scene.start("GameScene");
        });
    }

    let cont = this.add.text(config.width/2, 650, "Continue (Level "+currentLevel+")",
        {fontSize:"22px", backgroundColor:"#334155", padding:10})
        .setOrigin(0.5)
        .setInteractive();

    cont.on("pointerdown", ()=>{
        this.scene.start("GameScene");
    });
};

function GameScene(){
    Phaser.Scene.call(this, { key: "GameScene" });
}
GameScene.prototype = Object.create(Phaser.Scene.prototype);

GameScene.prototype.create = function(){
    this.comboText = this.add.text(20,80,"Combo: 0",{fontSize:"20px",fill:"#facc15"});
    this.levelText = this.add.text(20,20,"Level: "+currentLevel,{fontSize:"20px",fill:"#fff"});
    this.timerText = this.add.text(20,50,"Time: 60",{fontSize:"20px",fill:"#f87171"});

    this.timeLeft = 60;
    this.timerEvent = this.time.addEvent({
        delay:1000,
        callback:()=>{
            this.timeLeft--;
            this.timerText.setText("Time: "+this.timeLeft);
            if(this.timeLeft<=0){
                this.scene.start("MenuScene");
            }
        },
        loop:true
    });

    createLevel(this);
};

function createLevel(scene){
    scene.tiles = [];
    scene.selected = null;

    let size = 4 + Math.floor(currentLevel/10);
    scene.targetSum = 10 + currentLevel;

    let tileSize = Math.min(config.width, config.height) / (size + 3);

    scene.add.text(config.width-200,20,"Target: "+scene.targetSum,
        {fontSize:"20px",fill:"#4ade80"});

    for(let r=0;r<size;r++){
        for(let c=0;c<size;c++){
            let value = Phaser.Math.Between(1,9+Math.floor(currentLevel/5));

            let x = config.width/2 - (size/2*tileSize) + c*tileSize + tileSize/2;
            let y = 150 + r*tileSize;

            let rect = scene.add.rectangle(x,y,tileSize-8,tileSize-8,0x2563eb)
                .setStrokeStyle(2,0xffffff)
                .setInteractive();

            let text = scene.add.text(x,y,value,{fontSize:"20px",fill:"#fff"})
                .setOrigin(0.5);

            rect.value=value;
            rect.textObj=text;

            rect.on("pointerdown",()=>handleClick(scene,rect));

            scene.tiles.push(rect);
        }
    }
}

function handleClick(scene,tile){
    if(!scene.selected){
        scene.selected=tile;
        tile.setFillStyle(0xef4444);
        return;
    }

    if(scene.selected.value + tile.value === scene.targetSum){
        animateDestroy(scene, scene.selected);
        animateDestroy(scene, tile);

        scene.tiles = scene.tiles.filter(t=>t!==scene.selected && t!==tile);

        combo++;
        scene.comboText.setText("Combo: "+combo);

        clearTimeout(comboTimer);
        comboTimer = setTimeout(()=>{
            combo=0;
            scene.comboText.setText("Combo: 0");
        },2000);

        if(scene.tiles.length===0){
            currentLevel++;
            if(currentLevel>100) currentLevel=1;
            saveProgress(currentLevel);
            scene.scene.restart();
        }
    } else {
        scene.selected.setFillStyle(0x2563eb);
    }

    scene.selected=null;
}

function animateDestroy(scene,tile){
    scene.tweens.add({
        targets:[tile,tile.textObj],
        scale:0,
        alpha:0,
        duration:300,
        onComplete:()=>{
            tile.textObj.destroy();
            tile.destroy();
        }
    });
}
