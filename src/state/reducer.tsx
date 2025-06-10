import { SET_DOC_UPDATE, SET_EDIT_MODE } from "./actions";

export const reducer = (state: any, action: any) => {
  switch (action.type) {
    case SET_DOC_UPDATE:
      return {
        ...state,
        doc: action.payload,
      };
    case SET_EDIT_MODE:
      return {
        ...state,
        editMode: action.payload,
      };
    default:
      return state;
  }
};
