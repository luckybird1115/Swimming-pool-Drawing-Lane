import React from 'react';
import DrawAniShape from './animationDrawing/index';

const AnimationDrawing = ({laneNumber, time, state, swimEndPreview, orientation, isAnimation, startingLane, endingLane, upOrDown}) => {
    return (
        <DrawAniShape laneNumber={laneNumber} time={time} state={state} swimEndPreview={swimEndPreview} orientation={orientation} isAnimation={isAnimation} startingLane={startingLane} endingLane={endingLane} upOrDown={upOrDown}/>
    )
}

export default AnimationDrawing