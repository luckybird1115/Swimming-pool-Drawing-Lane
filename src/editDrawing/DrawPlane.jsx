import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useThree, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import Spline from './SplineCurve';
import { Line2 } from "three/examples/jsm/lines/Line2"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry"
import { extend } from '@react-three/fiber'
import { Text, GradientTexture } from '@react-three/drei'
import DrawPoint from './DrawPoint';
import { connect } from "react-redux";
import { getValue, addPoints, addCPoints, addVCPoints, addControls, addLeftCorners, addRightCorners, addCurves } from '../redux/action';
import { useDispatch } from 'react-redux'
import { ShaderMaterial } from 'three';
import { clone } from 'lodash';

extend({ LineMaterial, LineGeometry, Line2 })

const canvasWidth = 1280;
const canvasHeight = 720;
const fontUrl = './font/OpenSans-Medium.ttf'

const getMiddle = (curvePoints) => {
  let curve = new THREE.CatmullRomCurve3(curvePoints);
  let middle = curve.getPointAt(0.5);
  return middle;
}

const getCorners = (curvePoints, laneNum) => {
  let curve = new THREE.CatmullRomCurve3(curvePoints);
  let corners = [];
  for (var i = 0; i <= laneNum; i++) {
    let cornerPoints = curve.getSpacedPoints(100);
    let endpoint = cornerPoints[Math.floor(100 / laneNum * i)];
    corners.push(endpoint);
  }
  return corners;
}

const getCorner = (curvePoints, index, delta) => {
  let curve = new THREE.CatmullRomCurve3(curvePoints);
  let corner = curve.getPointAt((9 * index + index * (index - 1) / 2) / 100 + delta);
  return corner;
}

const CurveString = ({ curvePoints, pos, laneWidth, text, index, anchorX, anchorY, size }) => {
  const [textArray, setTextArray] = useState([]);
  const groupRef = useRef();
  useEffect(() => {
    if (String(text).length === 1) {
      setTextArray([text]);
    } else if (text.length > 1) {
      setTextArray(text.split(''));
    } else return;
  }, [curvePoints])
  return (
    <group ref={groupRef}>
      {textArray.map((txt, ind) => {
        return (
          <CurveText
            key={ind}
            curvePoints={curvePoints}
            laneWidth={laneWidth}
            pos={pos + 0.055 * ind * laneWidth * 0.45}
            index={index}
            row={ind}
            anchorX={anchorX}
            anchorY={anchorY}
            size={size}
            text={txt}
          /> 
        )
      })}
    </group>
  );
}

const CurveText = ({ curvePoints, pos, laneWidth, text, index, row, anchorX, anchorY, size }) => {
  const textRef = useRef();
  useEffect(() => {
    if (Math.abs(pos) <= 1) {
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const point = curve.getPointAt(pos); // Position the group at the midpoint of the curve
      let posY = point.y - laneWidth / 2 - (8 - index) * 0.03
      textRef.current.position.set(point.x + laneWidth * 0.13 * row, posY + laneWidth * 0.05, point.z + 0.4);
      const tangent = curve.getTangentAt(pos);
      textRef.current.rotation.z = Math.atan2(tangent.y, tangent.x);
      textRef.current.rotation.x = -0.5;
      textRef.current.rotation.y = 0;
    }
  }, [curvePoints]);

  var fontSize = laneWidth * size * 0.7;

  return (
    <Text
      ref={textRef}
      font={fontUrl}
      fontSize={fontSize}
      fontWeight="bold"
      color="white"
      anchorX={anchorX}
      anchorY={anchorY}
      scale={[1.3, 1, 1]}
    >
      {text}
    </Text>
  );
};

function Mark({ curvePoints, laneWidth, pos, index}) {
  
  const texture = useLoader(THREE.TextureLoader, './svg/mark.png');
  texture.minFilter = THREE.NearestFilter;
  texture.anisotropy = 120;

  const markRef = useRef();
  useEffect(() => {
    if (pos <= 1) {
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const point = curve.getPointAt(pos); // Position the group at the midpoint of the curve
      let posY = point.y - laneWidth / 2 - (8 - index) * 0.03
      markRef.current.position.set(point.x + laneWidth * 0.13, posY + laneWidth * 0.05, point.z + 0.4);
      const tangent = curve.getTangentAt(pos);
      markRef.current.rotation.z = Math.atan2(tangent.y, tangent.x);
      markRef.current.rotation.x = -0.5;
      markRef.current.rotation.y = 0;
      var markSize = laneWidth / 7;
      markRef.current.scale.set(markSize * 1.5, markSize, markSize);
    }
  }, [curvePoints]);
  
  return (
    <mesh ref={markRef} position={[100, 0, 0]}>
      <planeBufferGeometry attach="geometry" args={[3, 3]} />
      <meshBasicMaterial attach="material" map={texture} transparent/>
    </mesh>
  )
}



const DrawOuter = (props) => {

  const {
    corners,
    controls,
    Vcurves,
    setLeftCorners,
    setRightCorners,
    setControls,
    setDelta,
    setVCuves,
    VCpoints,
    setVCpoints,
    state,
    addPoints,
    addCPoints,
    addVCPoints,
    previewState,
    laneNum,
    removeFirst,
    setRemoveFirst,
    removeLast,
    setRemoveLast,
    drawingSystem,
    setLeftCornersArray,
    setRightCornersArray,
    setRemoveDirection,
    isSideControlMoved,
    setIsSideControlMoved
  } = props

  const dispatch = useDispatch();
  const { viewport } = useThree();
  const width = viewport.width;

  const cornersPixels = useMemo(() => !drawingSystem?corners.map((v, i) => (i % 2 === 0) ? (v - 0.5) * width : (canvasHeight / (2 * canvasWidth) - v) * width):corners, [corners]);
  const controlsPixels = useMemo(() => !drawingSystem?controls.map((v, i) => (i % 2 === 0) ? (v - 0.5) * width : (canvasHeight / (2 * canvasWidth) - v) * width):controls, [controls]);

  const [curves, setCuves] = useState([]);
  const [points, setPoints] = useState([]);
  const [cPoints, setCPoints] = useState([]);
  const [leftCorners, setMLeftCorners] = useState([]);
  const [rightCorners, setMRightCorners] = useState([]);
  const [mControls, setMControls] = useState([]);

  useEffect(() => {
    let prePoints = [];
    prePoints.push(new THREE.Vector3(cornersPixels[0], cornersPixels[1], 0));
    prePoints.push(new THREE.Vector3(cornersPixels[2], cornersPixels[3], 0));
    prePoints.push(new THREE.Vector3(cornersPixels[4], cornersPixels[5], 0));
    prePoints.push(new THREE.Vector3(cornersPixels[6], cornersPixels[7], 0));
    setPoints([...prePoints]);
    addPoints([...prePoints]);
  }, [cornersPixels])

  useEffect(() => {
    let prePoints = [];
    if (controlsPixels.length !== 0) {
      prePoints.push(new THREE.Vector3(controlsPixels[0], controlsPixels[1], 0))
      prePoints.push(new THREE.Vector3(controlsPixels[2], controlsPixels[3], 0))
      prePoints.push(new THREE.Vector3(controlsPixels[4], controlsPixels[5], 0))
      prePoints.push(new THREE.Vector3(controlsPixels[6], controlsPixels[7], 0))
    }
    setCPoints([...prePoints]);
    addCPoints([...prePoints]);
  }, [controlsPixels])

  useEffect(() => {
    if (points.length !== 0) {
      let pre_cuves = [];
      if (cPoints.length !== 0) {
        pre_cuves.push({ points: [points[0], cPoints[0], cPoints[1], points[1]] });
        pre_cuves.push({ points: [points[2], cPoints[2], cPoints[3], points[3]] });
        setCuves([...pre_cuves])
        dispatch(addCurves([...pre_cuves]));
      }
    }
  }, [points, cPoints])

  useEffect(() => {
    if (isSideControlMoved) {
      if (points.length !== 0) {
        let pre_Vcurve = [];
        if (VCpoints && VCpoints.length !== 0) {
          pre_Vcurve.push({ points: [points[0], VCpoints[0], VCpoints[1], points[2]] });
          pre_Vcurve.push({ points: [points[1], VCpoints[2], VCpoints[3], points[3]] });
          setVCuves([...pre_Vcurve])
  
          dispatch(addLeftCorners(getCorners(pre_Vcurve[0].points, laneNum)));
          dispatch(addRightCorners(getCorners(pre_Vcurve[1].points, laneNum)));
          setLeftCorners(getCorners(pre_Vcurve[0].points, laneNum));
          setMLeftCorners(getCorners(pre_Vcurve[0].points, laneNum));
          setRightCorners(getCorners(pre_Vcurve[1].points, laneNum));
          setMRightCorners(getCorners(pre_Vcurve[1].points, laneNum));
          
        }
      }
    }
  }, [points, VCpoints])


  useEffect(() => {
    if (cPoints.length !== 0) {
      let preControls = {}
      preControls.first = getCorners([cPoints[0], cPoints[2]], laneNum);
      preControls.second = getCorners([cPoints[1], cPoints[3]], laneNum);
      dispatch(addControls(preControls));
      setControls(preControls);
      setMControls(preControls);
    }
  }, [cPoints])

  useEffect(() => {
    if (Vcurves.length !== 0 && curves.length !== 0) {
      const deltaMiddle = Math.abs(getMiddle(curves[0].points).y - getMiddle(curves[1].points).y);
      const deltaLeft = Math.abs(points[0].y - points[2].y);
      const deltaRight = Math.abs(points[1].y - points[3].y);
      setDelta({
        "middle": deltaMiddle,
        "edge": Vcurves,
        "controls": cPoints,
        "leftRatio": deltaLeft / deltaMiddle,
        "rightRatio": deltaRight / deltaMiddle
      })
    }
  }, [curves, Vcurves])


  const onSetPoints = (e, index, type) => {
    switch (type) {
      case "corners":
        var prePoints = [...points];
        prePoints[index] = e;
        setPoints([...prePoints]);
        addPoints([...prePoints])
        setIsSideControlMoved(true);
        break;
      case "cPoints":
        var prePoints = [...cPoints];
        prePoints[index] = e;
        setCPoints([...prePoints]);
        addCPoints([...prePoints]);
        setIsSideControlMoved(true);
        break;
      case "VCpoints":
        var prePoints = [...VCpoints];
        prePoints[index] = e;
        setVCpoints([...prePoints]);
        addVCPoints([...prePoints]);
        setIsSideControlMoved(true);
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    if (removeFirst) {
      setLeftCornersArray(leftCorners);
      setRightCornersArray(rightCorners);
      setRemoveDirection('first');
      setRemoveFirst(false)
    }
  }, [removeFirst])

  useEffect(() => {
    if (removeLast) {
      setLeftCornersArray(leftCorners);
      setRightCornersArray(rightCorners);
      setRemoveDirection('last');
      setRemoveLast(false)
    }
  }, [removeLast])
  return (
    <>

      {
        curves.map((e, index) =>
          <Spline key={index} curve_points={e.points} previewState={previewState}/>
        )
      }
      {
        Vcurves.map((e, index) =>
          <Spline key={index} curve_points={e.points} previewState={previewState}/>
        )
      }
      {
        points.map((e, index) =>
          <DrawPoint
            key={index}
            position={e}
            onUpdate={(e) => onSetPoints(e, index, "corners")}
            state={state}
            previewState={previewState}
            isVCPoint={false}
          />
        )
      }
      {
        cPoints.map((e, index) =>
          <DrawPoint
            key={index}
            position={e}
            onUpdate={(e) => onSetPoints(e, index, "cPoints")}
            state={state}
            previewState={previewState}
            isVCPoint={false}
          />
        )
      }
      {
        VCpoints.map((e, index) =>
          <DrawPoint
            key={index}
            position={e}
            onUpdate={(e) => onSetPoints(e, index, "VCpoints")}
            state={state}
            previewState={previewState}
            isVCPoint={true}
          />
        )
      }

    </>
  )
}

const DrawInner = (props) => {
  const {
    laneNumberStr,
    laneNumber,
    controls,
    leftConners,
    rightCorners,
    onMoveLane,
    onSetCurvature,
    editingLaneNumber,
    state,
    previewState,
    sceneMark,
    startingLane,
    endingLane,
    upOrDown,
  } = props
  
  const [curves, setCuves] = useState([]);
  const [middleControls, setMiddleControls] = useState([]);

  useEffect(() => {
    console.log(laneNumber, leftConners);
    console.log(laneNumber, rightCorners);
    console.log(laneNumber, controls);
    let pre_cuves = [];
    if (controls.length !== 0) {
      pre_cuves.push({ points: [leftConners[0], controls[0], controls[1], rightCorners[0]] });
      pre_cuves.push({ points: [leftConners[1], controls[2], controls[3], rightCorners[1]] });
      setCuves([...pre_cuves])
    }
  }, [controls, leftConners, rightCorners])

  useEffect(() => {
    let preMiddle = [];
    if (parseInt(laneNumberStr, 10) !== 7 && curves.length !== 0) {
      preMiddle.push(getMiddle(curves[1].points))
      setMiddleControls([...preMiddle])
    }
  }, [curves])

  const Rect = (leftConners, rightCorners, curves) => {
    let topCurve = new THREE.CatmullRomCurve3(curves[0].points);
    let topPoints = topCurve.getSpacedPoints(100);
    let downCurve = new THREE.CatmullRomCurve3(curves[1].points);
    let downPoints = downCurve.getSpacedPoints(100);

    const RectShape = new THREE.Shape();
    RectShape.moveTo(rightCorners[1].x, rightCorners[1].y);
    for (let i = downPoints.length - 1; i >= 0; i--) {
      RectShape.lineTo(downPoints[i].x, downPoints[i].y);
    }
    RectShape.lineTo(leftConners[0].x, leftConners[0].y);
    for (let i = 0; i < topPoints.length; i++) {
      RectShape.lineTo(topPoints[i].x, topPoints[i].y);
    }
    RectShape.lineTo(rightCorners[1].x, rightCorners[1].y);
    return RectShape
  }

  const NumberRect = (leftConners, percent, curves) => {
    
    let topCurve = new THREE.CatmullRomCurve3(curves[0].points);
    let topPoints = topCurve.getSpacedPoints(100);
    let downCurve = new THREE.CatmullRomCurve3(curves[1].points);
    let downPoints = downCurve.getSpacedPoints(100);

    const RectShape = new THREE.Shape();
    RectShape.moveTo(leftConners[0].x, leftConners[0].y);
    for (let i = 0; i <= percent; i++) {
      RectShape.lineTo(topPoints[i].x, topPoints[i].y);
    }
    RectShape.lineTo(downPoints[percent].x, downPoints[percent].y);
    for (let i = percent - 1; i >= 0; i--) {
      RectShape.lineTo(downPoints[i].x, downPoints[i].y);
    }
    RectShape.lineTo(leftConners[0].x, leftConners[0].y);
    return RectShape
  }

  useEffect(() => {
  }, [laneNumber])

  useEffect(() => {
  }, [sceneMark])
  return (
    <>
      {
        curves.length !== 0 &&
        <>
          {
           !sceneMark? 
           <GradientBox rect={Rect} leftConners={leftConners} rightCorners={rightCorners} curves={curves} editingLaneNumber={editingLaneNumber} laneNumberStr={laneNumberStr}/>:
            <mesh position={[0, 0, -0.05]}>
              <shapeGeometry attach="geometry" args={[Rect(leftConners, rightCorners, curves)]} />
              {laneNumber === editingLaneNumber?
              <meshStandardMaterial color={'#ffffff'} opacity={0.4} transparent={true}/>
              : 
              <meshStandardMaterial color={'#222222'} opacity={0.4} transparent={true}/>
              }
            </mesh>
          }
          <mesh position={[0, 0, 0]}>
            <shapeGeometry args={[NumberRect(leftConners, 15, curves)]}/>
            <meshStandardMaterial color={laneNumber === editingLaneNumber?'#0072ff': '#00306b'} opacity={0.5} transparent={true} />
          </mesh>
          <CurveString
            curvePoints={curves[0].points}
            laneWidth={curves[0].points[0].y - curves[1].points[0].y}
            pos={0.1}
            index={laneNumber + 1}
            text={upOrDown?laneNumber + Number(startingLane):Number(endingLane) - laneNumber}
            anchorX={"right"}
            anchorY={"middle"}
            size={1.1}
          />
          <Mark 
            curvePoints={curves[0].points}
            laneWidth={curves[0].points[0].y - curves[1].points[0].y}
            pos={0.18}
            index={laneNumber + 1}
          />
          <CurveString
            curvePoints={curves[0].points}
            laneWidth={curves[0].points[0].y - curves[1].points[0].y}
            pos={0.3}
            index={laneNumber + 1}
            text={"LANE" + (upOrDown?laneNumber + Number(startingLane):Number(endingLane) - laneNumber) + "SWIMMER"}
            anchorX={"center"}
            anchorY={"middle"}
            size={0.7}
          />
        </>
      }
      {
        curves.map((e, index) =>
          <Spline key={index} curve_points={e.points} previewState={previewState}/>
        )
      } 
      {
        (Number(laneNumber) !== 0) && (Number(laneNumber) !== Number(endingLane) - Number(startingLane) + 1) &&
        <>
          <DrawPoint
            position={leftConners[0]}
            onUpdate={(e) => onSetCurvature(e, "left")}
            state={state}
            previewState={previewState}
            isVCPoint={false}
          />
          <DrawPoint
            position={controls[0]}
            onUpdate={(e) => onSetCurvature(e, "first")}
            state={state}
            previewState={previewState}
            isVCPoint={false}
          />
          <DrawPoint
            position={controls[1]}
            onUpdate={(e) => onSetCurvature(e, "second")}
            state={state}
            previewState={previewState}
            isVCPoint={false}
          />
          <DrawPoint
            position={rightCorners[0]}
            onUpdate={(e) => onSetCurvature(e, "right")}
            state={state}
            previewState={previewState}
            isVCPoint={false}
          />
        </>
      }
    </>
  )
}

const GradientBox = ({rect, leftConners, rightCorners, curves, editingLaneNumber, laneNumberStr}) => {
  const canvasRef = useRef();
  const gradientWidth = 10;
  const gradientHeight = 10;
  const canvas = document.createElement('canvas');
  canvas.width = gradientWidth;
  canvas.height = gradientHeight;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, gradientWidth * 1.1, 0);
  gradient.addColorStop(0, '#014f8a');
  gradient.addColorStop(0.5, '#015697');
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, gradientWidth, gradientHeight);
  canvasRef.current = canvas;
  return (
    <mesh position={[0, 0, -0.05]}>
      <shapeGeometry attach="geometry" args={[rect(leftConners, rightCorners, curves)]} />
      <meshBasicMaterial attach='material' opacity={(editingLaneNumber === parseInt(laneNumberStr, 10)) ? 0.9 :0.4} transparent={true} map={new THREE.CanvasTexture(canvasRef.current)} />
    </mesh>
  )
}

const Plane = (props) => {
  const { drawingOuter, drawingByLaneNumber, editingLaneNumber, state, startingLane } = props;
  const [leftConners, setLeftCorners] = useState([]);
  const [rightCorners, setRightCorners] = useState([]);
  const [Vcurves, setVCuves] = useState([]);
  const [controls, setControls] = useState({});
  const [VCpoints, setVCpoints] = useState([]);
  const [initDelta, setDelta] = useState({})
  const [highlighting, setHighLightingLane] = useState(editingLaneNumber)
  const [moving, setMoving] = useState(true)

  const [corners, setCorners] = useState([]);
  const [basicControls, setBasicControls] = useState([]);
  const [vControls, setVControls] = useState([]);

  const [removeFirst, setRemoveFirst] = useState(false);
  const [removeLast, setRemoveLast] = useState(false);

  const [isSideControlMoved, setIsSideControlMoved] = useState(true);

  const ref = useRef()

  useEffect(() => {
    useLoader.preload(THREE.TextureLoader, './svg/mark.png');
  }, [])

  useEffect(() => {
    if (drawingOuter) {
      setCorners(drawingOuter.corners);
      setBasicControls(drawingOuter.controls);
      setVControls(drawingOuter.VControls);
    }
  }, [drawingOuter])

  const VcontrolsPixels = useMemo(() => !props.drawingSystem?vControls.map((v, i) => (i % 2 === 0) ? (v - 0.5) * width : (canvasHeight / (2 * canvasWidth) - v) * width):vControls, [vControls]);
  
  useEffect(() => {
    let prePoints = [];
    if (VcontrolsPixels && VcontrolsPixels.length !== 0) {
      prePoints.push(new THREE.Vector3(VcontrolsPixels[0], VcontrolsPixels[1], 0))
      prePoints.push(new THREE.Vector3(VcontrolsPixels[2], VcontrolsPixels[3], 0))
      prePoints.push(new THREE.Vector3(VcontrolsPixels[4], VcontrolsPixels[5], 0))
      prePoints.push(new THREE.Vector3(VcontrolsPixels[6], VcontrolsPixels[7], 0))
    }
    setVCpoints(prePoints);
    props.addVCPoints(prePoints);
  }, [VcontrolsPixels])

  useEffect(() => {
    if (drawingByLaneNumber && Object.entries(drawingByLaneNumber)[0]) {
      if (!Object.entries(drawingByLaneNumber)[0][1].enabled) {
        setRemoveFirst(true);
      } 
      
      if (!Object.entries(drawingByLaneNumber)[Object.entries(drawingByLaneNumber).length - 1][1].enabled) {
        setRemoveLast(true);
      }
    }
  }, [drawingByLaneNumber])

  const onMoveLane = (delta, laneNumber) => {
    if (initDelta.edge.length !== 0) {
      const ratio = delta / initDelta.middle;
      var preLeftCorners = [...leftConners];
      preLeftCorners[laneNumber + 1] = getCorner(initDelta.edge[0].points, laneNumber + 1, ratio * initDelta.leftRatio);
      setLeftCorners([...preLeftCorners])
      var preRightCorners = [...rightCorners];
      preRightCorners[laneNumber + 1] = getCorner(initDelta.edge[1].points, laneNumber + 1, ratio * initDelta.rightRatio);
      setRightCorners([...preRightCorners])
      var preControls = { ...controls };
      preControls.first[laneNumber + 1] = getCorner([initDelta.controls[0], initDelta.controls[2]], laneNumber + 1, ratio);
      preControls.second[laneNumber + 1] = getCorner([initDelta.controls[1], initDelta.controls[3]], laneNumber + 1, ratio);
      setControls({ ...preControls });

      props.addLeftCorners([...preLeftCorners]);
      props.addRightCorners([...preRightCorners]);
      props.addControls({ ...preControls }); 
    }
  }

  const onSetCurvature = (newPos, type, laneNumber) => {
    let preControls = { ...controls };
    let preLeftCorners = {...leftConners};
    let preRightCorners = {...rightCorners};
    switch (type) {
      case 'left':
        preLeftCorners[laneNumber] = newPos;
        setIsSideControlMoved(false);
        break;
      case 'first':
        preControls.first[laneNumber] = newPos;
        break;
      case 'second':
        preControls.second[laneNumber] = newPos;
        break;
      case 'right':
        preRightCorners[laneNumber] = newPos;
        setIsSideControlMoved(false);
        break;
      default:
        break;
    }
    setControls({ ...preControls })
    setLeftCorners({ ...preLeftCorners });
    setRightCorners({ ...preRightCorners });
    let newVCurves = createVCurveBySideConners(leftConners, rightCorners);
    setVCuves(newVCurves);
    let newVCPoints = createVCPointsByNewVCurve(newVCurves);
    setVCpoints(newVCPoints);
    props.addControls({ ...preControls });
    props.addLeftCorners({ ...preLeftCorners });
    props.addRightCorners({ ...preRightCorners });
    props.addVCPoints({ ...newVCPoints });
  }

  const createVCurveBySideConners = (leftCorners, rightCorners) => {
    let VCurveArray = [];
    let leftArray = [];
    let rightArray = [];
    Object.keys(leftConners).forEach(leftKey => {
      leftArray.push(leftConners[leftKey]);
    })
    Object.keys(rightCorners).forEach(rightKey => {
      rightArray.push(rightCorners[rightKey]);
    })
    VCurveArray.push({points: leftArray});
    VCurveArray.push({points: rightArray});
    return VCurveArray;
  }

  const createVCPointsByNewVCurve = (newVCurves) => {
    let leftCurve = new THREE.CatmullRomCurve3(newVCurves[0].points);
    let leftPoints = leftCurve.getSpacedPoints(100);
    let rightCurve = new THREE.CatmullRomCurve3(newVCurves[1].points);
    let rightPoints = rightCurve.getSpacedPoints(100);
    let newVCPoints = [];
    newVCPoints.push(leftPoints[33]);
    newVCPoints.push(leftPoints[66]);
    newVCPoints.push(rightPoints[33]);
    newVCPoints.push(rightPoints[66]);
    return newVCPoints;
  }

  let elapsed = 0;
  let direction = 1;

  useEffect(() => {
    setHighLightingLane(editingLaneNumber);
  }, [editingLaneNumber])

  useFrame((_, delta) => {

  })
  
  useEffect(() => {
    
  }, [leftConners, rightCorners, basicControls, corners])
  return (
    <>
      {
        drawingOuter && 
        <group position={[0, 0, 0]} ref={ref} >
          <DrawOuter
            corners={corners}
            controls={basicControls}
            Vcurves={Vcurves}
            setLeftCorners={setLeftCorners}
            setRightCorners={setRightCorners}
            setControls={setControls}
            setDelta={setDelta}
            setVCuves={setVCuves}
            VCpoints={VCpoints}
            setVCpoints={setVCpoints}
            state={state}
            addPoints={props.addPoints}
            addCPoints={props.addCPoints}
            addVCPoints={props.addVCPoints}
            previewState={props.previewState}
            sceneMark = {props.sceneMark}
            laneNum={props.laneNum}
            removeFirst={removeFirst}
            removeLast={removeLast}
            setRemoveFirst={setRemoveFirst}
            setRemoveLast={setRemoveLast}
            drawingSystem={props.drawingSystem}
            setLeftCornersArray={props.setLeftCornersArray}
            setRightCornersArray={props.setRightCornersArray}
            setRemoveDirection={props.setRemoveDirection}
            isSideControlMoved={isSideControlMoved}
            setIsSideControlMoved={setIsSideControlMoved}
          />
          {
            (leftConners.length !== 0 && rightCorners.length !== 0) &&
            Object.entries(drawingByLaneNumber).map(([laneNumberStr, { enabled }]) => {
              if (!enabled) return null;
              const laneNumber = parseInt(laneNumberStr, 10);
              console.log(laneNumber);
              console.log(highlighting);
              return <DrawInner
                key={laneNumber}
                laneNumberStr={laneNumber}
                laneNumber={laneNumber}
                controls={[controls.first[laneNumber], controls.second[laneNumber], controls.first[laneNumber + 1], controls.second[laneNumber + 1]]}
                leftConners={[leftConners[laneNumber], leftConners[laneNumber + 1]]}
                rightCorners={[rightCorners[laneNumber], rightCorners[laneNumber + 1]]}
                onMoveLane={(delta) => onMoveLane(delta, laneNumber)}
                onSetCurvature={(newPos, type) => onSetCurvature(newPos, type, laneNumber)}
                editingLaneNumber={highlighting - startingLane + 1}
                state={state}
                previewState={props.previewState}
                sceneMark={props.sceneMark}
                startingLane={startingLane}
                endingLane={props.endingLane}
                upOrDown={props.upOrDown}
              />
            })
          }
        </group>
      }
      
    </>
  )
}

const mapStateToProps = value => {
    return { addShape: value.addShape };
};

const mapDispatchToProps = {
  getValue, addPoints, addCPoints, addVCPoints, addControls, addLeftCorners, addRightCorners, addCurves
};

export default connect(mapStateToProps, mapDispatchToProps)(Plane);