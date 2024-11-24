function GovernanceLayout({ children }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {children[0]} {/* ProposalsList */}
      </div>
      <div>
        {children[1]} {/* CreateProposal */}
      </div>
    </div>
  );
}

export default GovernanceLayout; 