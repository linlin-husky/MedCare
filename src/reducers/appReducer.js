"use strict";

const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  CLEAR_SUCCESS: 'CLEAR_SUCCESS',
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  SET_PAGE: 'SET_PAGE',
  SET_ITEMS: 'SET_ITEMS',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  SET_LENDINGS: 'SET_LENDINGS',
  SET_BORROWINGS: 'SET_BORROWINGS',
  SET_PENDING_REQUESTS: 'SET_PENDING_REQUESTS',
  SET_ACTIVITIES: 'SET_ACTIVITIES',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_ANALYTICS: 'SET_ANALYTICS',
  SET_SELECTED_ITEM: 'SET_SELECTED_ITEM',
  SET_SELECTED_LENDING: 'SET_SELECTED_LENDING',
  SET_PUBLIC_ITEMS: 'SET_PUBLIC_ITEMS',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  UPDATE_USER: 'UPDATE_USER'
};

const initialState = {
  isLoading: false,
  error: null,
  success: null,
  user: null,
  isLoggedIn: false,
  currentPage: 'login',
  items: [],
  lendings: [],
  borrowings: [],
  pendingRequests: [],
  activities: [],
  unreadCount: 0,
  analytics: null,
  selectedItem: null,
  selectedLending: null,
  publicItems: [],
  searchResults: []
};

function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case ACTIONS.SET_SUCCESS:
      return { ...state, success: action.payload };

    case ACTIONS.CLEAR_SUCCESS:
      return { ...state, success: null };

    case ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isLoggedIn: true,
        currentPage: 'dashboard',
        isLoading: false,
        unreadCount: action.payload.unreadCount || 0
      };

    case ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        isLoading: false
      };

    case ACTIONS.LOGOUT:
      return {
        ...initialState,
        currentPage: 'login'
      };

    case ACTIONS.SET_PAGE:
      return {
        ...state,
        currentPage: action.payload,
        error: null
      };

    case ACTIONS.SET_ITEMS:
      return { ...state, items: action.payload };

    case ACTIONS.ADD_ITEM:
      return { ...state, items: [...state.items, action.payload] };

    case ACTIONS.UPDATE_ITEM:
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };

    case ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };

    case ACTIONS.SET_LENDINGS:
      return { ...state, lendings: action.payload };

    case ACTIONS.SET_BORROWINGS:
      return { ...state, borrowings: action.payload };

    case ACTIONS.SET_PENDING_REQUESTS:
      return { ...state, pendingRequests: action.payload };

    case ACTIONS.SET_ACTIVITIES:
      return { ...state, activities: action.payload };

    case ACTIONS.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };

    case ACTIONS.SET_ANALYTICS:
      return { ...state, analytics: action.payload };

    case ACTIONS.SET_SELECTED_ITEM:
      return { ...state, selectedItem: action.payload };

    case ACTIONS.SET_SELECTED_LENDING:
      return { ...state, selectedLending: action.payload };

    case ACTIONS.SET_PUBLIC_ITEMS:
      return { ...state, publicItems: action.payload };

    case ACTIONS.SET_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload };

    default:
      return state;
  }
}

export { ACTIONS, initialState, appReducer };
