import { useEffect, useState } from 'react';
import { Tabs, Typography } from 'antd';
import ProductsTab from './ProductsTab';
import CategoriesTab from './CategoriesTab';
import BrandsTab from './BrandsTab';

export default function CatalogPage() {
  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Sản phẩm & Danh mục</Typography.Title>
      </div>
      <Tabs
        defaultActiveKey="products"
        items={[
          { key: 'products', label: 'Sản phẩm / SKU', children: <ProductsTab /> },
          { key: 'categories', label: 'Danh mục', children: <CategoriesTab /> },
          { key: 'brands', label: 'Thương hiệu', children: <BrandsTab /> },
        ]}
      />
    </div>
  );
}
