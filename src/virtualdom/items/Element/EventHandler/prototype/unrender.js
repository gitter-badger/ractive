import genericHandler from 'virtualdom/items/Element/EventHandler/shared/genericHandler';

export default function EventHandler$unrender () {

	if ( this.custom ) {
		this.custom.teardown();
	}

	else {
		this.node.removeEventListener( this.name, genericHandler, false );
	}

	this.hasListener = false;

}
