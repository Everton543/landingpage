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

const validateOwnerInfo = (info) => {
  if (!info || typeof info !== 'object') {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(info, 'name') || 
  !Object.prototype.hasOwnProperty.call(info, 'searchMode') ||
  !Object.prototype.hasOwnProperty.call(info, 'displayAllOpinions')
  ) {
      return false;
  }

  if (typeof info.displayAllOpinions !== 'boolean') {
    return false;
  }

  if (info.name === null || info.name === '' ||
    info.searchMode === null || info.searchMode === '' ||
    info.displayAllOpinions === null || info.displayAllOpinions === ''
  ) {
    return false;
  }

  switch(info.searchMode){
    case 'byDate':
    case 'priority':
      return true;
    default:
      return false;
  }
}
  
module.exports = { validateProductInfo, validateProductSoldInfo, validateOwnerInfo};