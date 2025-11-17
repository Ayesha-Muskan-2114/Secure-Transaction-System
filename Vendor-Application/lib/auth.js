export const setAuth = (token, vendorData) => {
  localStorage.setItem('vendor_token', token);
  localStorage.setItem('vendor_data', JSON.stringify(vendorData));
};

export const getAuth = () => {
  const token = localStorage.getItem('vendor_token');
  const vendorData = localStorage.getItem('vendor_data');
  return {
    token,
    vendor: vendorData ? JSON.parse(vendorData) : null,
  };
};

export const clearAuth = () => {
  localStorage.removeItem('vendor_token');
  localStorage.removeItem('vendor_data');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('vendor_token');
};