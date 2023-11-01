const validateProductInfo = (product) => {
    if (!product || typeof product !== 'object') {
      return false;
    }
  
    if (!Object.prototype.hasOwnProperty.call(product, 'name') || 
    !Object.prototype.hasOwnProperty.call(product, 'detail')) {
        return false;
    }
  
    if (product.name === null || product.name === '' || product.detail === null || product.detail === '') {
      return false;
    }
  
    return true;
};
  
module.exports = { validateProductInfo};