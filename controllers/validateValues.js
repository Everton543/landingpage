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

const validateProductSoldInfo = (productSold) => {
  if (!productSold || typeof productSold !== 'object') {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(productSold, 'name') || 
  !Object.prototype.hasOwnProperty.call(productSold, 'productId') ||
  !Object.prototype.hasOwnProperty.call(productSold, 'dateSold') ||
  !Object.prototype.hasOwnProperty.call(productSold, 'hasOpinion')
  ) {
      return false;
  }

  if (productSold.name === null || productSold.name === '' ||
    productSold.productId === null || productSold.productId === '' ||
    productSold.dateSold === null || productSold.dateSold === ''
  ) {
    return false;
  }

  return true;
}
  
module.exports = { validateProductInfo, validateProductSoldInfo};