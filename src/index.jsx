import React, { memo, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import {
  CircleIcon,
  IconButton,
  Button,
  ResetIcon,
  CrossIcon,
  TickCircleIcon,
  DirectionRightIcon,
  DirectionLeftIcon,
  DoubleChevronLeftIcon,
  DoubleChevronRightIcon,
} from 'evergreen-ui';
import uniqBy from 'lodash/uniqBy';
import {useFrame, useLoader} from '@react-three/fiber'
import * as THREE from 'three'

import LaneDrawings, { handleSize } from './LaneDrawings';
import { Provider } from "react-redux";

import { createStore } from "redux";

import reducer from "./redux/reducer";
import EditDrawing from './editDrawing';
import AnimationDrawing from './AnimationDrawing';



// These values don't matter so much, but higher values will yield better quality (but probably lower performance)
const boxWidth = 600;
const boxHeight = 200;

// Just some dummy data:

function getResultsByLaneNumber(laneNumber) {
  return Object.fromEntries(Array.from({ length: 9 }).map((a, i) => ([
    i,
    {
      swimmerLastName: `Lane ${i} Swimmer`,
      placeRanking: i + 1,
      swimEndTime: 10 + Math.random() * 5,
      swimDuration: 5 + Math.random() * 5,
      teamLogoUrl: 'https://swimclips-teams.s3.amazonaws.com/logos/MITT.svg',
      darkShadow: true,
      swimStartTime: 2,
    },
  ])))[laneNumber];
}

const canvasWidth = 1280;
const canvasHeight = 720;
// const laneNum = 8;

// Here is some dummy data:
const src = 'https://swimclips-static.s3.us-east-1.amazonaws.com/lane-drawings-v2-demo-sample.mp4';

// const firstLaneNumber = 0;
// const activeLaneNumbers = [0, 1, 2, 3, 4, 5, 6, 7];



var draggingState = "";

const LaneDrawer = memo(() => {
  const [editingLaneNumber, setEditingLaneNumber] = useState('');
  const [showInstruction, setShowInstruction] = useState(true);
  const [swimEndPreview, setSwimEndPreview] = useState(false);

  const [orientation, setOrientation] = useState('rtl');
  // const [drawingByLaneNumber, setDrawingByLaneNumber] = useState(dummyDrawingsByLaneNumber);
  const [drawingByLaneNumber, setDrawingByLaneNumber] = useState({});
  const [drawingOuter, setDrawingOuter] = useState();
  const [time, setTime] = useState(1);

  const [state, setState] = useState("")
  const [previewState, setPreviewState] = useState(true);
  const [showDots, setShowDots] = useState(true);

  const [editingLaneNumberClone, setEditingLaneNumberClone] = useState('NAN')
  const [sceneMark, setSceneMark] = useState(false);
  const [isAnimation, setIsAnimation] = useState(false)

  const [startingLane, setStartingLane] = useState(0);
  const [endingLane, setEndingLane] = useState(0);
  const [activeLaneNumbers, setActiveLaneNumbers] = useState([]);
  const [laneNum, setLaneNum] = useState(0);

  const [isClickable, setIsClickable] = useState(false);
  const [drawingSystem, setDrawingSystem] = useState(false);

  const [leftCornersArray, setLeftCornersArray] = useState([]);
  const [rightCornersArray, setRightCornersArray] = useState([]);
  const [removeDirection, setRemoveDirection] = useState('');

  const [corners, setCorners] = useState([]);

  const [upOrDown, setUpOrDown] = useState(true);

  function getInitialCorners() {
    return corners;
  }

  const outControls = () => {
    let midPoints = [];
    let corners = getInitialCorners();
    let Ux = getControls(corners[0], corners[2]);
    let Dx = getControls(corners[4], corners[6]);
    let Uy = getControls(corners[1], corners[3]);
    let Dy = getControls(corners[5], corners[7]);
    midPoints = [Ux[0], Uy[0], Ux[1], Uy[1], Dx[0], Dy[0], Dx[1], Dy[1]];
    return midPoints;
  }

  const getVerticalControls = () => {
    let midPoints = [];
    let corners = getInitialCorners();
    let Lx = getControls(corners[0], corners[4]);
    let Rx = getControls(corners[2], corners[6]);
    let Ly = getControls(corners[1], corners[5]);
    let Ry = getControls(corners[3], corners[7]);
    midPoints = [Lx[0], Ly[0], Lx[1], Ly[1], Rx[0], Ry[0], Rx[1], Ry[1]];
    return midPoints;
  }

  const reset = useCallback(() => {
    setState("reset")
    let drawing = {}
    drawing[0] = {
      corners: getInitialCorners(),
      enabled: true,
      controls: outControls()
    }

    setDrawingByLaneNumber(drawing);
    setEditingLaneNumber(startingLane);
    setShowInstruction(true);
  }, [startingLane, setDrawingByLaneNumber]);

  const checkDrawing = () => {
    setState("check");
  }

  const editOuter = () => {
    setState("edit");
    if (drawingOuter) {

    } else {
      let initOuter = {}
      initOuter = {
        corners: getInitialCorners(),
        enabled: true,
        controls: outControls(),
        VControls: getVerticalControls()
      }
      setEditingLaneNumber(0);
      setShowInstruction(true);
      setDrawingOuter(initOuter)
      autoDrawing(initOuter);
    }
  }

  const autoDrawing = (currentOuter) => {
    let preDrawingLaneNumber = {}

    const outerControls = currentOuter.controls;

    const Lcx = getCorners(outerControls[0], outerControls[4], laneNum);
    const Lcy = getCorners(outerControls[1], outerControls[5], laneNum);
    const Rcx = getCorners(outerControls[2], outerControls[6], laneNum);
    const Rcy = getCorners(outerControls[3], outerControls[7], laneNum);

    for (let i = 0; i < laneNum; i++) {
      preDrawingLaneNumber[i] = {
        "enabled": true,
        "corners": [],
        "controls": [
          Lcx[i],
          Lcy[i],
          Rcx[i],
          Rcy[i],
          Lcx[i + 1],
          Lcy[i + 1],
          Rcx[i + 1],
          Rcy[i + 1]
        ]
      }
    }
    setDrawingByLaneNumber({ ...preDrawingLaneNumber })
  }

  const getCorners = (first, end, laneNum) => {

    const distance = Math.abs(first - end);
    let min, max, dir;
    if (first < end) {
      min = first;
      max = end;
      dir = 1;
    } else {
      min = end;
      max = first;
      dir = -1;
    }
    let group = [];
    if (dir === 1)
      group.push(min);
    else
      group.push(max)
    for (let index = 1; index <= laneNum; index++) {
      group.push(group[index - 1] + dir * distance / laneNum)
    }
    return group;
  }

  const getControls = (first, end) => {
    const distance = Math.abs(first - end);
    let group = [];
    if (first < end) {
      group.push(first + distance / 3)
      group.push(first + distance * 2 / 3)
    } else {
      group.push(first - distance / 3)
      group.push(first - distance * 2 / 3)
    }

    return group;
  }

  const onResetClick = useCallback(async () => {
    reset();
  }, [reset]);

  const onEditOuter = useCallback(async () => {
    if ((startingLane === endingLane) && startingLane === 0) {
      alert("Please input the number of start and end lanes");
    } else {
      if (corners.length !== 0) {
        setPreviewState(true);
        setShowDots(false);
        editOuter();
      } else {
        alert('click the corner points!')
      }
    }
  }, [editOuter]);

  const onFinishClick = useCallback(async () => {
    setIsAnimation(false);
    setDrawingOuter(false);
    setTime(0);
    checkDrawing();
  }, [checkDrawing]);

  const editedCornersEntries = Object.entries(drawingByLaneNumber);

  const editingLaneDrawing = useMemo(() => {
    const ret = drawingByLaneNumber[editingLaneNumber];
    if (ret) return ret;

    if (editedCornersEntries.length === 0) {
      return {
        corners: getInitialCorners(),
        enabled: true,
      };
    }

    const lastEditedLane = editedCornersEntries[editedCornersEntries.length - 1];
    const { corners: c } = lastEditedLane[1];
    return {
      corners: [c[4], c[5], c[6], c[7], c[0], c[1], c[2], c[3]], // flip the coordinates so that it's upside down
      enabled: true,
    };
  }, [drawingByLaneNumber, editedCornersEntries, editingLaneNumber]);

  // Only show the overlays that have been edited (and the currently editing one)
  const visibleDrawingByLaneNumber = Object.fromEntries(uniqBy([
    ...editedCornersEntries,
    ...(editingLaneDrawing.corners != null && state !== "" ? [[editingLaneNumber, editingLaneDrawing]] : []),
  ], ([laneNumberStr]) => laneNumberStr));

  const toggleLaneEnabled = (laneNumber) => {
    const { corners = getInitialCorners(), enabled = true, ...rest } = drawingByLaneNumber[laneNumber] || {};
    setDrawingByLaneNumber({
      ...drawingByLaneNumber,
      [laneNumber]: {
        ...rest,
        corners,
        enabled: !enabled,
      },
    });
  };

  const showPreview = () => {
    setPreviewState(false);
  }

  const onClickOrientation = () => {
    setOrientation(orientation === 'ltr' ? 'rtl' : 'ltr');
  }

  const playAnimation = () => {
    setDrawingOuter(false);
    setIsAnimation(true)
    setTime(0);
    checkDrawing();    
  }

  useEffect(() => {
    if (Number(endingLane) > Number(startingLane)) {
      let laneArray = [];
      for (let index = Number(startingLane) - 1; index < Number(endingLane); index++) {
        laneArray.push(index);
      }
      setActiveLaneNumbers(laneArray);
      setLaneNum(endingLane - startingLane + 1);
    } else if (endingLane === startingLane) {
      setActiveLaneNumbers([]);
    }
  }, [startingLane, endingLane])

  useEffect(() => {
    if (editingLaneNumberClone !== 'NAN') {
      setSceneMark(true);
    } else {
      setSceneMark(false);
    }
  }, [editingLaneNumberClone])

  const drawButtons = () => {
    setIsClickable(!isClickable);
  }

  const returnPointArray = (a) => {
    setDrawingSystem(true);
    setCorners([a[0].x, a[0].y, a[1].x, a[1].y, a[2].x, a[2].y, a[3].x, a[3].y])
  }

  useEffect(() => {
    if ((removeDirection === 'first') && (leftCornersArray.length !== 0) && (rightCornersArray.length !== 0)) {
      let cornerCloneArray = corners;
      cornerCloneArray[0] = leftCornersArray[1].x;
      cornerCloneArray[1] = leftCornersArray[1].y;
      cornerCloneArray[2] = rightCornersArray[1].x;
      cornerCloneArray[3] = rightCornersArray[1].y;
      setCorners([...cornerCloneArray]);
      setStartingLane(Number(startingLane) + 1);
      setDrawingSystem(true);
      setRemoveDirection('');
      
      window.document.getElementById('finishButton').click();
      window.setTimeout(()=>{
        window.document.getElementById('editButton').click();
      }, 500);
      
    } else if ((removeDirection === 'last') && (leftCornersArray.length !== 0) && (rightCornersArray.length !== 0)) {
      let cornerCloneArray = corners;
      cornerCloneArray[4] = leftCornersArray[leftCornersArray.length - 2].x;
      cornerCloneArray[5] = leftCornersArray[leftCornersArray.length - 2].y;
      cornerCloneArray[6] = rightCornersArray[rightCornersArray.length - 2].x;
      cornerCloneArray[7] = rightCornersArray[rightCornersArray.length - 2].y;
      setCorners([...cornerCloneArray]);
      setEndingLane(Number(endingLane) - 1);
      setDrawingSystem(true);
      setRemoveDirection('');
      
      window.document.getElementById('finishButton').click();
      window.setTimeout(()=>{
        window.document.getElementById('editButton').click();
      }, 500);
    }
  }, [leftCornersArray, rightCornersArray, removeDirection, state])

  const upOrDownFunc = () => {
    setUpOrDown(!upOrDown);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginLeft: 10, marginTop: 5, marginBottom: 10 }}>
        <div style={{ marginBottom: 10 }}>Please draw all lanes as they appear in the meet results. Deactivate <CrossIcon style={{ verticalAlign: 'middle' }} /> / <TickCircleIcon style={{ verticalAlign: 'middle' }} /> lanes that are not covered by this camera. Make sure that Orientation <DirectionLeftIcon style={{ verticalAlign: 'middle' }} /> <DirectionRightIcon style={{ verticalAlign: 'middle' }} /> is correct. Make sure to preview both <b>Start</b> and <b>Finish</b> to make sure everything looks good. Make sure there is room for names. View the example before drawing. Be sure to <b>check that the camera did not move</b> during the meet day.</div>
        <div className='drawButton'>
          <label style={{marginRight: '10px'}}>Starting lane</label>
          <input type='number' style={{marginRight: '20px'}} value={startingLane?startingLane: ''} onChange={(e) => {setStartingLane(e.target.value)}}/>
          <label style={{marginRight: '10px'}}>Ending lane</label>
          <input type='number' style={{marginRight: '200px'}} value={endingLane?endingLane: ''} onChange={(e) => {setEndingLane(e.target.value)}}/>
          <Button onClick={drawButtons} intent="danger" style={{marginRight: '10px'}}>Click Points</Button>
          <Button onClick={upOrDownFunc} intent="danger">{upOrDown?'up':'down'}</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          { (activeLaneNumbers.length !== 0) &&
            activeLaneNumbers.map((laneNumber, index) => {
              const { enabled = true, corners } = drawingByLaneNumber[laneNumber] || {};

              function getLaneButtonColor() {
                if (editingLaneNumber !== laneNumber) return undefined;
                return enabled ? 'success' : 'danger';
              }

              function getIcon() {
                if (!enabled) return CrossIcon;
                if (!corners) return CircleIcon;
                return TickCircleIcon;
              }

              return (
                <div key={laneNumber} style={{ display: 'flex', marginRight: 7, flexDirection: "column" }} title={enabled ? `Draw lane ${laneNumber}` : `Lane overlays are deactivated for lane ${laneNumber}`}>
                  <div>
                    <Button disabled={state !== "edit"} appearance={editingLaneNumberClone === laneNumber ? 'primary' : undefined} intent={getLaneButtonColor()} onClick={() => {/*setEditingLaneNumber(laneNumber); */setEditingLaneNumberClone(laneNumber)}} >Lane {upOrDown?laneNumber + 1:endingLane - laneNumber + startingLane - 1}</Button>
                    <IconButton disabled={state !== "edit"} icon={getIcon()} intent={enabled ? 'success' : 'danger'} onClick={() => (index === 0) || (index === activeLaneNumbers.length - 1)?toggleLaneEnabled(laneNumber - Number(startingLane) + 1): 0} />
                  </div>
                </div>
              );

            })
          }
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button iconBefore={orientation === 'rtl' ? DirectionLeftIcon : DirectionRightIcon} onClick={onClickOrientation}>Orientation</Button>
          <Button iconBefore={ResetIcon} onClick={onResetClick} intent="danger">Reset</Button>
          <Button iconBefore={ResetIcon} disabled={state === "reset"} onClick={onEditOuter} id="editButton" intent="danger">Edit Outer</Button>
          <Button iconBefore={ResetIcon} onClick={showPreview} intent="danger">Finish Drawing & Check</Button>
          <Button onClick={playAnimation} intent="danger">Play animation</Button>
          <Button iconBefore={swimEndPreview ? DoubleChevronRightIcon : DoubleChevronLeftIcon} appearance="primary" id="finishButton" onClick={onFinishClick}>{swimEndPreview ? 'Previewing start' : 'Previewing'}</Button>
          <input type="range" min="0" max="1000" value={Math.floor((time / 20) * 1000)} onChange={(e) => setTime((parseInt(e.target.value, 10) / 1000) * 20)} style={{ width: 600 }} />
        </div>
      </div>

      <div style={{ overflow: 'auto', flexGrow: 1, }}>
        <div style={{ width: canvasWidth, height: canvasHeight, position: 'relative', margin: 'auto' }}>
          <video src={src} autoPlay loop muted style={{ display: 'block', position: 'absolute', pointerEvents: 'none', width: canvasWidth, height: canvasHeight }} />
          {
            (state === "check") && 
            <AnimationDrawing laneNumber={laneNum} time={time * 5} state={state} swimEndPreview={swimEndPreview} orientation={orientation} isAnimation={isAnimation} startingLane={startingLane} endingLane={endingLane} upOrDown={upOrDown}/>
          }
          <EditDrawing
            drawingByLaneNumber={visibleDrawingByLaneNumber}
            drawingOuter={drawingOuter}
            editingLaneNumber={editingLaneNumberClone}
            state = {state}
            previewState = {previewState}
            sceneMark={sceneMark}
            laneNum={laneNum}
            startingLane={startingLane}
            endingLane={endingLane}
            isClickable={isClickable}
            returnPointArray={returnPointArray}
            setIsClickable={setIsClickable}
            drawingSystem={drawingSystem}
            setLeftCornersArray={setLeftCornersArray}
            setRightCornersArray={setRightCornersArray}
            setRemoveDirection={setRemoveDirection}
            showDots={showDots}
            upOrDown={upOrDown}
          />
        </div>
      </div>
    </div>
  );
});
useLoader.preload(THREE.TextureLoader, './svg/mark.png');
const store = createStore(reducer);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <LaneDrawer />
    </Provider>
  </React.StrictMode>,
);
