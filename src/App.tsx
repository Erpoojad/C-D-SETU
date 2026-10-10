import React, { useState } from 'react';
import {
  UserRole,
  MaterialListing,
  PickupRequest,
  IllegalDumpingReport,
  ManifestDocument,
  UserProfile,
  PickupStatus,
} from './types';
import {
  INITIAL_LISTINGS,
  INITIAL_PICKUPS,
  INITIAL_DUMPING_REPORTS,
  SAMPLE_MANIFEST,
  INITIAL_USER_PROFILES,
} from './data/mockData';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { StakeholderDashboard } from './components/StakeholderDashboard';
import { MaterialMarketplace } from './components/MaterialMarketplace';
import { DecentralizedGISNetwork } from './components/DecentralizedGISNetwork';
import { SmartRoutingEngine } from './components/SmartRoutingEngine';
import { CalculatorSection } from './components/CalculatorSection';
import { IllegalDumpingReporter } from './components/IllegalDumpingReporter';
import { Footer } from './components/Footer';

// Modals
import { AiWasteScannerModal } from './components/AiWasteScannerModal';
import { LogisticsBookingModal } from './components/LogisticsBookingModal';
import { ComplianceManifestModal } from './components/ComplianceManifestModal';
import { MaterialOrderModal } from './components/MaterialOrderModal';
import { PickupTrackerModal } from './components/PickupTrackerModal';
import { CreateListingModal } from './components/CreateListingModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CheckCircle2, Bell } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('generator');
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(INITIAL_USER_PROFILES);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USER_PROFILES[0]);

  const [listings, setListings] = useState<MaterialListing[]>(INITIAL_LISTINGS);
  const [pickups, setPickups] = useState<PickupRequest[]>(INITIAL_PICKUPS);
  const [dumpingReports, setDumpingReports] = useState<IllegalDumpingReport[]>(INITIAL_DUMPING_REPORTS);
  const [manifestDoc, setManifestDoc] = useState<ManifestDocument>(SAMPLE_MANIFEST);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [isManifestOpen, setIsManifestOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isCreateListingOpen, setIsCreateListingOpen] = useState<boolean>(false);
  const [selectedListingForOrder, setSelectedListingForOrder] = useState<MaterialListing | null>(null);
  const [trackingPickup, setTrackingPickup] = useState<PickupRequest | null>(null);

  // Booking preload params from scanner or calculator
  const [bookingPreloadTons, setBookingPreloadTons] = useState<number>(4.5);
  const [bookingPreloadMaterial, setBookingPreloadMaterial] = useState<string>('concrete');
  const [bookingPreloadSegregated, setBookingPreloadSegregated] = useState<boolean>(true);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'info' | 'success' } | null>(null);

  const showToast = (text: string, type: 'info' | 'success' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleOpenBooking = (tons?: number) => {
    if (tons) {
      setBookingPreloadTons(tons);
    }
    setIsBookingOpen(true);
  };

  const handleProceedFromScanner = (tons: number, material: string, isSeg: boolean) => {
    setBookingPreloadTons(tons);
    setBookingPreloadMaterial(material);
    setBookingPreloadSegregated(isSeg);
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = (newRequest: PickupRequest) => {
    setPickups([newRequest, ...pickups]);

    // Update user profile history & reputation
    const updatedUser: UserProfile = {
      ...currentUser,
      reputationPoints: currentUser.reputationPoints + 30,
      totalTransactions: currentUser.totalTransactions + 1,
      history: [
        {
          id: `hist-${Date.now().toString().slice(-4)}`,
          date: 'Just now',
          type: 'disposal',
          title: `${newRequest.isSegregated ? 'Segregated' : 'Mixed'} ${newRequest.materialType} (${newRequest.estimatedTons} MT)`,
          quantity: newRequest.estimatedTons,
          unit: 'MT',
          status: newRequest.status,
          co2SavedKg: Math.round(newRequest.estimatedTons * 42),
          destinationOrSource: newRequest.destinationPlant,
        },
        ...currentUser.history,
      ],
      reputationLog: [
        {
          id: `rep-${Date.now().toString().slice(-4)}`,
          date: 'Just now',
          title: 'Scheduled Responsible Tipper Dispatch',
          pointsDelta: 30,
          reason: `Manifest #${newRequest.manifestId} created with GPS routing`,
          type: 'gain',
        },
        ...currentUser.reputationLog,
      ],
    };

    setCurrentUser(updatedUser);
    setUserProfiles(userProfiles.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    showToast(`Tipper booked for ${newRequest.siteName}! Earned +30 Green Points.`);
  };

  const handleUpdatePickupStatus = (pickupId: string, nextStatus: PickupStatus) => {
    const updatedPickups = pickups.map((p) => {
      if (p.id === pickupId) {
        const updatedTimeline = p.statusTimeline.map((item) => {
          if (item.status === nextStatus) {
            return { ...item, completed: true, time: 'Just now' };
          }
          return item;
        });

        return {
          ...p,
          status: nextStatus,
          statusTimeline: updatedTimeline,
        };
      }
      return p;
    });

    setPickups(updatedPickups);
    const target = updatedPickups.find((p) => p.id === pickupId);
    if (target) {
      setTrackingPickup(target);
    }

    if (nextStatus === 'Disposal complete') {
      // Award additional completion points & tons diverted
      const updatedUser: UserProfile = {
        ...currentUser,
        reputationPoints: currentUser.reputationPoints + 50,
        totalDivertedMT: +(currentUser.totalDivertedMT + (target?.estimatedTons || 3)).toFixed(1),
        co2SavedKg: currentUser.co2SavedKg + Math.round((target?.estimatedTons || 3) * 42),
      };
      setCurrentUser(updatedUser);
      setUserProfiles(userProfiles.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      showToast(`Disposal Complete! +50 Points awarded for verified diversion.`);
    } else {
      showToast(`Pickup Status Updated: "${nextStatus}" for lot #${pickupId}`);
    }
  };

  const handleCreateListing = (newListing: MaterialListing) => {
    setListings([newListing, ...listings]);

    // Award user points for listing circular material
    const updatedUser: UserProfile = {
      ...currentUser,
      reputationPoints: currentUser.reputationPoints + 40,
      totalTransactions: currentUser.totalTransactions + 1,
      reputationLog: [
        {
          id: `rep-${Date.now().toString().slice(-4)}`,
          date: 'Just now',
          title: 'Circular Material Listed for Exchange',
          pointsDelta: 40,
          reason: `Listed ${newListing.title} (${newListing.quantity} ${newListing.unit})`,
          type: 'gain',
        },
        ...currentUser.reputationLog,
      ],
    };

    setCurrentUser(updatedUser);
    setUserProfiles(userProfiles.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    showToast(`Published "${newListing.title}" to marketplace! +40 Green Points added.`);
  };

  const handleAddDumpingReport = (newReport: IllegalDumpingReport) => {
    setDumpingReports([newReport, ...dumpingReports]);
    showToast(`Incident reported to Ward Health Inspector. Tracking Token #${newReport.id}.`);
  };

  const handleOrderSuccess = (details: { listingTitle: string; quantity: number; totalCost: number }) => {
    // Award buyer points for purchasing circular aggregates
    const updatedUser: UserProfile = {
      ...currentUser,
      reputationPoints: currentUser.reputationPoints + 50,
      totalDivertedMT: +(currentUser.totalDivertedMT + details.quantity).toFixed(1),
      co2SavedKg: currentUser.co2SavedKg + Math.round(details.quantity * 42),
    };
    setCurrentUser(updatedUser);
    setUserProfiles(userProfiles.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    showToast(`Order confirmed for ${details.quantity} tons of ${details.listingTitle}! +50 Green Points.`);
  };

  const scrollToMarketplace = () => {
    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs max-w-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        onOpenBookingModal={() => handleOpenBooking()}
        onOpenScannerModal={() => setIsScannerOpen(true)}
        onOpenProfileModal={() => setIsProfileOpen(true)}
        userPoints={currentUser.reputationPoints}
        userName={currentUser.name}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onOpenBookingModal={() => handleOpenBooking()}
          onOpenScannerModal={() => setIsScannerOpen(true)}
          onScrollToMarketplace={scrollToMarketplace}
        />

        {/* Stakeholder Dashboard Console */}
        <StakeholderDashboard
          currentRole={currentRole}
          pickups={pickups}
          onOpenBookingModal={() => handleOpenBooking()}
          onOpenScannerModal={() => setIsScannerOpen(true)}
          onOpenManifestModal={() => setIsManifestOpen(true)}
          onTrackPickup={(p) => setTrackingPickup(p)}
        />

        {/* Material Marketplace with Buy, Sell & Free Exchange */}
        <MaterialMarketplace
          listings={listings}
          onSelectListingForQuote={(listing) => setSelectedListingForOrder(listing)}
          onOpenCreateListing={() => setIsCreateListingOpen(true)}
        />

        {/* Decentralized GIS Infrastructure for Tier-2 & Tier-3 Small Cities */}
        <DecentralizedGISNetwork />

        {/* Smart Proximity & Multi-Tier Routing Logic */}
        <SmartRoutingEngine />

        {/* C&D Waste & Carbon Savings Calculator */}
        <CalculatorSection onOpenBookingModal={handleOpenBooking} />

        {/* Swachh Setu Citizen Vigilance & Hotspot Tracker */}
        <IllegalDumpingReporter
          reports={dumpingReports}
          onAddReport={handleAddDumpingReport}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Real-Time Waste Pickup Tracking Modal */}
      <PickupTrackerModal
        pickup={trackingPickup}
        isOpen={!!trackingPickup}
        onClose={() => setTrackingPickup(null)}
        onUpdateStatus={handleUpdatePickupStatus}
      />

      {/* User Profile & Gamified Reputation Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        allUsers={userProfiles}
        onSwitchUser={(u) => setCurrentUser(u)}
      />

      {/* Create Listing / Free Exchange Modal */}
      <CreateListingModal
        isOpen={isCreateListingOpen}
        onClose={() => setIsCreateListingOpen(false)}
        onListingCreated={handleCreateListing}
        sellerCity={currentUser.city}
        sellerName={currentUser.companyOrAffiliation || currentUser.name}
      />

      {/* AI Rubble Scanner Modal */}
      <AiWasteScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProceedToBooking={handleProceedFromScanner}
      />

      {/* Logistics Booking Tipper Dispatch Modal */}
      <LogisticsBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onConfirmBooking={handleConfirmBooking}
        initialEstimatedTons={bookingPreloadTons}
        initialMaterial={bookingPreloadMaterial}
        initialSegregated={bookingPreloadSegregated}
      />

      {/* CPCB Form-I Compliance Manifest Modal */}
      <ComplianceManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
        manifest={manifestDoc}
      />

      {/* Material Procurement Order Modal */}
      <MaterialOrderModal
        listing={selectedListingForOrder}
        onClose={() => setSelectedListingForOrder(null)}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
}
