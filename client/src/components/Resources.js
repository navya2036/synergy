import React, { useState, useEffect } from 'react';
import { formDataApi } from '../utils/api';
import './Resources.css';

const Resources = ({ projectId, isTeamMember }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchResources();
    }
  }, [projectId]); // fetchResources is defined inside the component, so it's stable

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching resources for project:', projectId);
      
      const { data } = await formDataApi.get(`/api/projects/${projectId}/resources`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      console.log('Resources fetched successfully:', data.length);
      setResources(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching resources:', err);
      const errorMessage = err.response?.data?.msg || 'Failed to load resources';
      setError(errorMessage);
      
      // Log more details about the error
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadError(null);

    try {
      console.log('Preparing to upload file:', file.name);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': localStorage.getItem('token')
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log('Upload progress:', percentCompleted + '%');
        },
        timeout: 300000 // 5 minutes
      };

      console.log('Starting file upload...');
      const { data } = await formDataApi.post(
        `/api/projects/${projectId}/resources`,
        formData,
        config
      );
      console.log('Upload successful:', data);
      
      await fetchResources();
      event.target.value = null; // Reset file input
      setUploadError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error uploading file:', err);
      let errorMessage = 'Failed to upload file';
      
      if (err.message === 'Network Error') {
        errorMessage = 'Network error occurred. Please check your internet connection and try again.';
      } else if (err.response) {
        // Server responded with an error
        errorMessage = err.response.data.msg || 'Server error occurred while uploading';
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please try again.';
      }
      
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resourceId, fileName) => {
    try {
      setError(null);
      const response = await formDataApi.get(`/api/resources/${resourceId}/download`, {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout for downloads
      });

      // Check if the response is actually a blob
      if (response.data instanceof Blob) {
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Invalid file data received');
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      const errorMessage = err.response?.data?.msg || 'Failed to download file. Please try again.';
      setError(errorMessage);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      const response = await formDataApi.delete(`/api/resources/${resourceId}`);
      console.log('Delete response:', response.data);
      await fetchResources();
    } catch (err) {
      console.error('Error deleting resource:', err);
      const errorMessage = err.response?.data?.msg || 'Failed to delete resource. Please try again.';
      setError(errorMessage);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Add debug logging effect
  useEffect(() => {
    console.log('Resources component props:', { isTeamMember, projectId });
  }, [isTeamMember, projectId]);

  if (loading) {
    return <div className="resources-loading">Loading resources...</div>;
  }

  return (
    <div className="resources-container">
      <div className="resources-header">
        <h2>Project Resources</h2>
        {isTeamMember && (
          <div className="upload-section">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              id="file-upload"
              className="file-input"
            />
            <label htmlFor="file-upload" className="upload-button">
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </label>
            {uploadError && <div className="upload-error">{uploadError}</div>}
          </div>
        )}
      </div>

      {error && <div className="resources-error">{error}</div>}

      <div className="resources-list">
        {resources.length === 0 ? (
          <div className="no-resources">No resources uploaded yet</div>
        ) : (
          resources.map((resource) => (
            <div key={resource._id} className="resource-item">
              <div className="resource-info">
                <i className="fas fa-file-pdf resource-icon"></i>
                <div className="resource-details">
                  <h3>{resource.name}</h3>
                  <p>
                    Uploaded by {resource.uploadedBy.name} on{' '}
                    {formatDate(resource.uploadDate)}
                  </p>
                  <p className="file-size">{formatFileSize(resource.fileSize)}</p>
                </div>
              </div>
              <div className="resource-actions">
                <button
                  onClick={() => handleDownload(resource._id, resource.name)}
                  className="download-button"
                >
                  <i className="fas fa-download"></i> Download
                </button>
                {isTeamMember && (
                  <button
                    onClick={() => handleDelete(resource._id)}
                    className="delete-button"
                  >
                    <i className="fas fa-trash-alt"></i> Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Resources;