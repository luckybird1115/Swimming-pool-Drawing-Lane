import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useGesture } from '@use-gesture/react'
import simplify from 'simplify-js'
import Spline from './SplineCurve';


const MAX_POINTS = 8
const POINTSIZE = 0.1
const obj = new THREE.Object3D();

const initPoints = []

initPoints.push(new THREE.Vector3(-5, -2, 0))
initPoints.push(new THREE.Vector3(-5, 2, 0))
initPoints.push(new THREE.Vector3(5, 2, 0))
initPoints.push(new THREE.Vector3(5, -2, 0))
// initPoints.push(new THREE.Vector3(-1, 2, 0))
// initPoints.push(new THREE.Vector3(0, 2, 0))
// initPoints.push(new THREE.Vector3(-1, -2, 0))
// initPoints.push(new THREE.Vector3(0, -2, 0))

const curve_group = [];

curve_group.push({ "points": [] })
curve_group.push({ "points": [] })

const DrawLane = ({editingLaneNumber}) => {

  const [state, setState] = useState("");
  const [pointNum, setMax] = useState(initPoints.length);
  const [points, setPoints] = useState(initPoints);
  const [endPoints, setEndPoints] = useState([]);
  const [cPoints, setCPoints] = useState(curve_group);
  const [curves, setCuves] = useState([]);
  const [color, setColor] = useState('black');
  const [l_edge, setLEdge] = useState(new THREE.BufferGeometry());
  const [r_edge, setREdge] = useState(new THREE.BufferGeometry());
  const [isAdd, setAddActive] = useState(true);
  // const [curve, setCurve] = useState(new THREE.CatmullRomCurve3(curve_points))

  const canvasWidth = 1280;
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  let planeIntersectPoint = new THREE.Vector3();



  useEffect(() => {

    setLEdge(new THREE.BufferGeometry().setFromPoints([points[0], points[1]]));
    setREdge(new THREE.BufferGeometry().setFromPoints([points[2], points[3]]));
    let pre_cuves = [];
    pre_cuves.push({ points: [points[1], ...cPoints[0].points, points[2]] });
    pre_cuves.push({ points: [points[0],  ...cPoints[1].points, points[3]] });

    setCuves([...pre_cuves])

  }, [points])


  const [pointsObject, setPointPos] = useMemo(() => {
    const geometry = new THREE.CircleBufferGeometry(POINTSIZE, 32) //new THREE.PlaneBufferGeometry(POINTSIZE,POINTSIZE)
    const material = new THREE.MeshBasicMaterial({ color: "red" })
    const mesh = new THREE.InstancedMesh(geometry, material, pointNum)

    const setPointPos = (point, index, count) => {
      const updatePoint = (p, i) => {
        const { x, y, z } = p
        obj.position.set(x, y, z);
        obj.updateMatrix();
        mesh.setMatrixAt(i, obj.matrix);
      }
      if (Array.isArray(point)) {
        point.forEach((po, i) => updatePoint(po, index + i))
      } else {
        updatePoint(point, index)
      }
      if (count) mesh.count = count
      mesh.instanceMatrix.needsUpdate = true
      mesh.updateMatrix()
    }
    points.forEach((p, i) => setPointPos(p, i));
    return [mesh, setPointPos]
  }, [points])


  const bindPoints = useGesture({

    onDragStart: () => {
      setState('editing');
      setAddActive(false);
    },
    onHover: ({ hovering, event }) => {
      setState(hovering ? 'editing' : undefined)
    },

    onDrag: ({ event }) => {
      const id = event.instanceId
      console.log(id);
      event?.stopPropagation()
      const pointExist = points[id]
      if (pointExist) {
        let tempIndex;
        let oldCPoints = [...cPoints];
        console.log(pointExist, oldCPoints[editingLaneNumber])
        oldCPoints[editingLaneNumber].points.forEach((e, index) => {
          if (e.x === pointExist.x && e.y === pointExist.y) tempIndex = index;
        })
        console.log(tempIndex, "dfdfd");
        event.ray.intersectPlane(floorPlane, planeIntersectPoint);
        if (planeIntersectPoint) {
          let oldData = [...points];
          oldData[id] = planeIntersectPoint;
          setPoints([...oldData]);
          setPointPos(planeIntersectPoint, id);
          console.log(tempIndex, "121313213");
          oldCPoints[editingLaneNumber].points[tempIndex] = planeIntersectPoint;
          oldCPoints[editingLaneNumber].points = sortPoints(oldCPoints[editingLaneNumber].points);
          setCPoints([...oldCPoints]);
        }
      }
      return { instanceId: id }
    },
    onDragEnd: () => {
      setState(undefined);
      setAddActive(true);
    }
  }, { eventOptions: { pointer: true }, hover: { enabled: state !== 'drawing' }, drag: { enabled: state !== 'drawing' } })

  const addPoints = (e) => {
    if (isAdd) {
      e.stopPropagation();
      setMax(pointNum + 1);
      let oldCPoints = [...cPoints];
      oldCPoints[editingLaneNumber].points.push(e.point);
      oldCPoints[editingLaneNumber].points = sortPoints(oldCPoints[editingLaneNumber].points);
      setCPoints([...oldCPoints]);
      let oldData = [...points];
      oldData.push(e.point);
      setPoints([...oldData]);
    }
  }

  const sortPoints = (points) => {
    let sort_points = [];
    const compareNumbers = (a, b) => {
      return a - b;
    }
    let x_value = [];
    points.map((e) => x_value.push(e.x));
    x_value.sort(compareNumbers);
    x_value.map((e) => sort_points.push(new THREE.Vector3(e, points.filter(point => point.x === e)[0].y, 0)));
    return sort_points;
  }

  return (
    <Canvas style={{ width: canvasWidth }}>
      <pointLight position={[0, 0, 3]} color="#f7f3ce" intensity={0.1} />
      <ambientLight color="#fff" intensity={0.85} />
      <mesh onClick={(e) => addPoints(e)}>
        <planeGeometry args={[15, 8]} />
        <meshBasicMaterial color="blue" opacity={0.1} visible={false} />
      </mesh>
      <line {...{ renderOrder: 5, geometry: l_edge }}>
        <lineBasicMaterial {...{ attach: "material", color: '#F00', width: 12 }} />
      </line>
      <line {...{ renderOrder: 5, geometry: r_edge }}>
        <lineBasicMaterial {...{ attach: "material", color: '#F00', width: 12 }} />
      </line>
      <primitive {...{ ...bindPoints(), renderOrder: 10, object: pointsObject, visible: true }}>
        <meshBasicMaterial {...{ attach: "material", color }} />
      </primitive>
      {
        curves.map((e, index) =>
          <Spline key={index} curve_points={e.points} />
        )
      }

    </Canvas>
  );
}

export default DrawLane;