import * as THREE from 'three'
import ReactDOM from 'react-dom'
import React, { useEffect, useRef, useMemo } from 'react'
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { WaterPass } from './Waterpass'
import { Effects } from '@react-three/drei/Effects'
import './styles.css'

// UnrealBloomPass => <unrealBloomPass />に変換
extend({ EffectComposer, ShaderPass, RenderPass, WaterPass, AfterimagePass, UnrealBloomPass })

function Swarm({ count }) {
  // meshを操作
  const mesh = useRef()
  // lightを操作
  const light = useRef()
  const { viewport, mouse } = useThree()

  // meshの情報を更新するための一時的に保存
  const dummy = useMemo(() => new THREE.Object3D(), [])
  /** countの数だけparticleの情報がある配列を作成
   *  countの数が変更されたら作成しなおす
   */
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100
      const factor = 20 + Math.random() * 100
      const speed = 0.01 + Math.random() / 200
      const xFactor = -50 + Math.random() * 100
      const yFactor = -50 + Math.random() * 100
      const zFactor = -50 + Math.random() * 100
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 })
    }
    return temp
  }, [count])
  // 毎フレーム実行
  useFrame((state) => {
    // pointLightをマウスの位置に設定
    light.current.position.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0)
    // Run through the randomized data to calculate some movement
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle
      // There is no sense or reason to any of this, just messing around with trigonometric functions
      t = particle.t += speed / 2
      const a = Math.cos(t) + Math.sin(t * 1) / 10
      const b = Math.sin(t) + Math.cos(t * 2) / 10
      const s = Math.cos(t)
      particle.mx += mouse.x * viewport.width * particle.mx * 0.01
      particle.my += mouse.y * viewport.height * particle.my * 0.01
      // Update the dummy object
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      )
      dummy.scale.set(s, s, s)
      dummy.rotation.set(s * 5, s * 5, s * 5)
      dummy.updateMatrix()
      // And apply the matrix to the instanced item
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    //meshの情報を更新
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <pointLight ref={light} distance={60} intensity={0.2} color="lightblue" />
      {/* InstancedMeshコンストラクタ（ジオメトリ：BufferGeometry、マテリアル：マテリアル、カウント：整数） */}
      <instancedMesh ref={mesh} args={[null, null, count]}>
        <dodecahedronBufferGeometry args={[1, 0]} />
        <meshStandardMaterial color="black" />
      </instancedMesh>
    </>
  )
}

// これだけでカメラのドリーを繰り返す
function Dolly() {
  // This one makes the camera move in and out
  useFrame(({ clock, camera }) => {
    camera.position.z = 50 + Math.sin(clock.getElapsedTime()) * 30
  })
  return null
}

function App() {
  return (
    <Canvas camera={{ fov: 75, position: [0, 0, 70] }}>
      <pointLight intensity={0.2} color="white" />
      <spotLight intensity={0.2} position={[70, 70, 70]} penumbra={1} color="lightblue" />
      <Swarm count={20000} />
      <Effects>
        {/* 水の中を揺らめくようなエフェクト */}
        <waterPass attachArray="passes" factor={2} />
        {/* ネオンの灯りのようなエフェクト */}
        <unrealBloomPass attachArray="passes" args={[undefined, 1.5, 1, 0]} />
      </Effects>
      <Dolly />
    </Canvas>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
