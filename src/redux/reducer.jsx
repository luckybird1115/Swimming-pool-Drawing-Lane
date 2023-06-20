import { combineReducers } from "redux";

let initialState = {
  points: [],
  cPoints: [],
  vCPoints: [],
  controls: [],
  leftCorners: [],
  rightCorners: [],
  curves: [],
}

const addShape = (state = initialState, action) => {
  switch (action.type) {
    case "GET_VALUE":
      return state
    case "ADD_POINTS":
      initialState.points = action.value;
      return state;
    case "ADD_CPOINTS":
      initialState.cPoints = action.value;
      return state;
    case "ADD_VCPOINTS":
      initialState.vCPoints = action.value;
      return state;
    case "ADD_CONTROLS":
      initialState.controls = action.value;
      return state;
    case "ADD_LEFTCORNERS":
      initialState.leftCorners = action.value;
      return state;
    case "ADD_RIGHTCORNERS":
      initialState.rightCorners = action.value;
      return state;
    case "ADD_CURVES":
      initialState.curves = action.value;
      return state;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  addShape
});

export default rootReducer;
