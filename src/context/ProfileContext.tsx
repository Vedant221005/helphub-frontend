import React, { createContext, useState } from 'react';

interface ProfileContextType {
  showProfile: boolean;
  userData: any;
  setShowProfile: (show: boolean) => void;
  setUserData: (data: any) => void;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: any) => {
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState(null);

  return (
    <ProfileContext.Provider
      value={{
        showProfile,
        userData,
        setShowProfile,
        setUserData,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = React.useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
};
