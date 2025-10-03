import React, { createContext, useContext, useState } from 'react';
import CreateProjectModal from '../components/CreateProjectModal';

const CreateProjectContext = createContext();

export const useCreateProject = () => {
  const context = useContext(CreateProjectContext);
  if (!context) {
    throw new Error('useCreateProject must be used within a CreateProjectProvider');
  }
  return context;
};

export const CreateProjectProvider = ({ children, user, onProjectCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCreateModal = () => {
    setIsModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
  };

  const handleProjectCreated = (newProject) => {
    if (onProjectCreated) {
      onProjectCreated(newProject);
    }
    closeCreateModal();
  };

  return (
    <CreateProjectContext.Provider
      value={{
        openCreateModal,
        closeCreateModal,
        isModalOpen
      }}
    >
      {children}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        onProjectCreated={handleProjectCreated}
        user={user}
      />
    </CreateProjectContext.Provider>
  );
};