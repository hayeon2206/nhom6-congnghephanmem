import { useState } from 'react';
import { App, Upload } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { uploadsApi } from '../api/resources';
import { resolveImageUrl } from '../utils/format';

const MAX_SIZE_MB = 5;

/**
 * A single-image uploader that plugs straight into an AntD Form.Item (it
 * accepts/emits a plain `value`/`onChange` string — the image's relative
 * URL — matching Form.Item's default contract, no valuePropName needed).
 * Uploads immediately on file select rather than staging it for a later
 * form submit, since the backend needs the file itself, not a data URL, and
 * the resulting URL is what actually gets saved on the product/category/brand.
 */
export default function ImageUploadField({ value, onChange }) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const beforeUpload = (file) => {
    if (!file.type.startsWith('image/')) {
      message.error('Chỉ chấp nhận file hình ảnh.');
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
      message.error(`Ảnh phải nhỏ hơn ${MAX_SIZE_MB}MB.`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    setLoading(true);
    try {
      const { url } = await uploadsApi.uploadImage(file);
      onChange?.(url);
      onSuccess?.(url);
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Tải ảnh lên thất bại.');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Upload
      listType="picture-card"
      showUploadList={false}
      beforeUpload={beforeUpload}
      customRequest={customRequest}
      accept="image/*"
    >
      {value ? (
        <img src={resolveImageUrl(value)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div>
          {loading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
        </div>
      )}
    </Upload>
  );
}
