"use client";
import React, { createContext, useReducer, useContext } from "react";
import { reducer } from "./reducer";
import { SET_DOC_UPDATE, SET_EDIT_MODE, TOKEN } from "./actions";

// Define your state type
interface AppState {
  doc: boolean;
  editMode: boolean;
  token: string;
}

// Define your context value type
interface ContextValue {
  state: AppState;
  setDoc: (payload: boolean) => void;
  setEditMode: (payload: boolean) => void;
  setToken: (payload: string) => void;
}

// Create context with initial value typed
export const Context = createContext<ContextValue>({
  state: {
    doc: false,
    editMode: false,
    token: "",
  },
  setDoc: () => {},
  setEditMode: () => {},
  setToken: () => {},
});

const initialState: AppState = {
  doc: false,
  editMode: false,
  token: "",
};

interface ProviderProps {
  children: React.ReactNode;
}

export function ProviderContext({ children }: ProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setDoc = (payload: boolean) =>
    dispatch({ type: SET_DOC_UPDATE, payload });
  const setEditMode = (payload: boolean) =>
    dispatch({ type: SET_EDIT_MODE, payload });
  const setToken = (payload: string) => dispatch({ type: TOKEN, payload });

  return (
    <Context.Provider
      value={{
        state,
        setDoc,
        setEditMode,
        setToken,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const UseContext = () => useContext(Context);
