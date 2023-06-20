import React from 'react';
import { Canvas, useFrame} from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import Plane from './DrawPlane'

const DrawAniShape = ({laneNumber, time, state, swimEndPreview, orientation, isAnimation, startingLane, endingLane, upOrDown}) => {

    return (
        <>
            <Canvas  >
                {/* <Camera /> */}
                <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={60} />
                <pointLight position={[0, 0, 3]} color="#f7f3ce" intensity={0.1} />
                <ambientLight color="#fff" intensity={0.85} />
                <Plane laneNumber={laneNumber} time={time} state={state} swimEndPreview={swimEndPreview} orientation={orientation} isAnimation={isAnimation} startingLane={startingLane} endingLane={endingLane} upOrDown={upOrDown}/>
            </Canvas>
        </>
    )
}

export default DrawAniShape;