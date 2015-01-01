import VERSION from "./marbles/version";
import Utils from "./marbles/utils";
import Dispatcher from "./marbles/dispatcher";
import State from "./marbles/state";
import Store from "./marbles/store";
import Events from "./marbles/events";
import History from "./marbles/history";
import Router from "./marbles/router";
import Accessors from "./marbles/accessors";
import Transaction from "./marbles/transaction";
import DirtyTracking from "./marbles/dirty_tracking";
import Validation from "./marbles/validation";
import { HTTPRequest, HTTP } from "./marbles/http";
import HTTPMiddleware from "./marbles/http/middleware";
import HTTPLinkHeader from "./marbles/http/link_header";
import MarblesObject from "./marbles/object";
import Model from "./marbles/model";
import Collection from "./marbles/collection";

export {
	Utils,
	Dispatcher,
	State,
	Store,
	Events,
	History,
	Router,
	Accessors,
	Transaction,
	DirtyTracking,
	Validation,
	HTTP,
	HTTPRequest,
	HTTPMiddleware,
	HTTPLinkHeader,
	/* jshint ignore:start */
	MarblesObject as Object,
	/* jshint ignore:end */
	Model,
	Collection
};

var Marbles = {
	VERSION: VERSION,
	Utils: Utils,
	Dispatcher: Dispatcher,
	State: State,
	Store: Store,
	Events: Events,
	History: History,
	Router: Router,
	Accessors: Accessors,
	Transaction: Transaction,
	DirtyTracking: DirtyTracking,
	Validation: Validation,
	HTTP: HTTP,
	HTTPRequest: HTTPRequest,
	Object: MarblesObject,
	Model: Model,
	Collection: Collection
};
Marbles.HTTP.Middleware = HTTPMiddleware;
Marbles.HTTP.LinkHeader = HTTPLinkHeader;
export default Marbles;
