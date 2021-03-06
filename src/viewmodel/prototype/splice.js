import types from 'config/types';

var implicitOption = { implicit: true }, noCascadeOption = { noCascade: true };

export default function Viewmodel$splice ( keypath, spliceSummary ) {
	var viewmodel = this, i, dependants, end, changeEnd;

	// Mark changed keypaths
	end = spliceSummary.rangeEnd;
	if ( spliceSummary.balance < 0 ) {
		changeEnd = end + spliceSummary.balance;
	}

	for ( i = spliceSummary.rangeStart; i < end; i += 1 ) {
		let options = ( i >= changeEnd ) ? noCascadeOption : void 0;
		viewmodel.mark( keypath + '.' + i, options );
	}

	if ( spliceSummary.balance ) {
		viewmodel.mark( keypath + '.length', implicitOption );
	}

	// Trigger splice operations
	if ( dependants = viewmodel.deps[ 'default' ][ keypath ] ) {
		dependants.filter( canSplice ).forEach( dependant => dependant.splice( spliceSummary ) );
	}
}

function canSplice ( dependant ) {
	return dependant.type === types.SECTION && ( !dependant.subtype || dependant.subtype === types.SECTION_EACH ) && dependant.rendered;
}
