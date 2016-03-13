///<reference path="three.min.js"/>
///<reference path="OrbitControls.js"/>
'use strict';

window.onload = init;

var renderer, scene, camera, stereoCamera;
var movieTexture;
var controls;
var isStereo = false;

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    stereoCamera = new THREE.StereoCamera();
    stereoCamera.aspect = 0.5;

    // カメラを手前に引く
    camera.position.z = 1.1;

    // 動画を表示させるPlaneジオメトリを生成
    var geometry = new THREE.PlaneBufferGeometry(1280 / 720, 1);

    // 動画を最セするためのvideoエレメントを作成
    var video = document.createElement('video');
    video.loop = true;
    video.autoplay = true;
    video.src = 'big-buck-bunny_294_1280x720.mp4';
    // 動画のメタ情報(サイズ)が取得できてからレンダリングを開始する
    video.onloadedmetadata = render;

    // videoエレメントからからテクスチャーを生成
    movieTexture = new THREE.Texture(video);
    // テクスチャーのminFilterをTHREE.LinearFilterにしないと警告が永遠と出まくる。
    movieTexture.minFilter = THREE.LinearFilter;

    // テクスチャーにmovieTextureを使用してマテリアルを生成
    // sideプロパティには、THREE.FrontSide(表), THREE.BackSide(裏), THREE.DoubleSide(表裏両方)が設定できる
    // THREE.DoubleSideを設定すると3Dオブジェクト(ポリゴン)の表はもとより裏を表示してもテクスチャーが描画される(裏は鏡像になる)。
    var material = new THREE.MeshBasicMaterial({ map: movieTexture, side: THREE.DoubleSide });

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // WebGLでレンダリングされていることを示すためマウスやタッチスライドで回転・ズームできるようにする
    controls = new THREE.OrbitControls(camera, renderer.domElement);
}

function render() {
    requestAnimationFrame(render);

    // movieTextureのフレームを更新する
    movieTexture.needsUpdate = true;

    // コントローラーアップデート
    controls.update();

    // レンダリング
    var size = renderer.getSize();
    var w = size.width;
    var h = size.height;
    if (isStereo) {
        // ステレオレンダリング
        stereoCamera.update(camera);
        w /= 2;
        renderer.setScissorTest(true);
        stereoRender(stereoCamera.cameraL, 0, 0, w, h);
        stereoRender(stereoCamera.cameraR, w, 0, w, h);
        renderer.setScissorTest(false);
    } else {
        // ノーマルレンダリング
        renderer.setViewport(0, 0, w, h);
        renderer.render(scene, camera);
    }
}

function stereoRender(sCamera, left, top, width, height) {
    sCamera.position.copy(camera.position);
    sCamera.quaternion.copy(camera.quaternion);
    sCamera.updateMatrix();
    renderer.setViewport(left, top, width, height);
    renderer.setScissor(left, top, width, height);
    renderer.render(scene, sCamera);
}

window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// デスクトップではAキーでステレオレンダリングのON/OFFができるようにする
window.addEventListener('keydown', function (evt) {
    if (evt.keyCode === 'A'.charCodeAt(0)) isStereo = !isStereo;
});

// モバイルではデバイスのオリエンテーションでステレオレンダリングのON/OFFができるようにする
window.addEventListener('orientationchange', function () {
    isStereo = Math.abs(window.orientation) === 90;
});
