import { useState } from 'react';
import { Platform, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';

import { PostForm } from '@/components/admin/PostForm';
import api from '@/services/api';

function showAndroidToast(message) {
  if (Platform.OS === 'android' && typeof ToastAndroid?.show === 'function') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

/**
 * Admin Create Post screen submitting to POST /api/posts.
 */
export default function AdminCreatePostScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleCreate = async (payload) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');

    try {
      await api.post('/api/posts', payload);
      const msg = 'New post created successfully.';
      setSuccessMessage(msg);
      showAndroidToast(msg);
      router.replace('/admin/posts');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to publish article.';
      throw new Error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PostForm
      mode="create"
      submitting={submitting}
      successMessage={successMessage}
      onSubmit={handleCreate}
      onCancel={() => router.replace('/admin/posts')}
    />
  );
}
