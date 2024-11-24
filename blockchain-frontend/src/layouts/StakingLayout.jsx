function StakingLayout({ children }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {children[0]} {/* StakingDashboard */}
        {children[1]} {/* StakingStats */}
      </div>
      <div className="space-y-6">
        {children[2]} {/* StakingForm */}
        {children[3]} {/* StakingRewards */}
      </div>
    </div>
  );
}

export default StakingLayout; 