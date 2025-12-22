"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWidgetConfigDto = exports.WidgetSizeDto = exports.WidgetMode = exports.WidgetType = void 0;
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var WidgetType;
(function (WidgetType) {
    WidgetType["CHAT"] = "chat";
    WidgetType["VOICE"] = "voice";
    WidgetType["MULTIMODAL"] = "multimodal";
})(WidgetType || (exports.WidgetType = WidgetType = {}));
var WidgetMode;
(function (WidgetMode) {
    WidgetMode["IFRAME"] = "iframe";
    WidgetMode["EMBED"] = "embed";
})(WidgetMode || (exports.WidgetMode = WidgetMode = {}));
var WidgetSizeDto = function () {
    var _a;
    var _width_decorators;
    var _width_initializers = [];
    var _width_extraInitializers = [];
    var _height_decorators;
    var _height_initializers = [];
    var _height_extraInitializers = [];
    return _a = /** @class */ (function () {
            function WidgetSizeDto() {
                this.width = __runInitializers(this, _width_initializers, void 0);
                this.height = (__runInitializers(this, _width_extraInitializers), __runInitializers(this, _height_initializers, void 0));
                __runInitializers(this, _height_extraInitializers);
            }
            return WidgetSizeDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _width_decorators = [(0, class_validator_1.IsOptional)()];
            _height_decorators = [(0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _width_decorators, { kind: "field", name: "width", static: false, private: false, access: { has: function (obj) { return "width" in obj; }, get: function (obj) { return obj.width; }, set: function (obj, value) { obj.width = value; } }, metadata: _metadata }, _width_initializers, _width_extraInitializers);
            __esDecorate(null, null, _height_decorators, { kind: "field", name: "height", static: false, private: false, access: { has: function (obj) { return "height" in obj; }, get: function (obj) { return obj.height; }, set: function (obj, value) { obj.height = value; } }, metadata: _metadata }, _height_initializers, _height_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.WidgetSizeDto = WidgetSizeDto;
var CreateWidgetConfigDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _mode_decorators;
    var _mode_initializers = [];
    var _mode_extraInitializers = [];
    var _characterId_decorators;
    var _characterId_initializers = [];
    var _characterId_extraInitializers = [];
    var _position_decorators;
    var _position_initializers = [];
    var _position_extraInitializers = [];
    var _size_decorators;
    var _size_initializers = [];
    var _size_extraInitializers = [];
    var _theme_decorators;
    var _theme_initializers = [];
    var _theme_extraInitializers = [];
    var _avatar_decorators;
    var _avatar_initializers = [];
    var _avatar_extraInitializers = [];
    var _abTestVariant_decorators;
    var _abTestVariant_initializers = [];
    var _abTestVariant_extraInitializers = [];
    var _analyticsEnabled_decorators;
    var _analyticsEnabled_initializers = [];
    var _analyticsEnabled_extraInitializers = [];
    var _config_decorators;
    var _config_initializers = [];
    var _config_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateWidgetConfigDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.type = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.mode = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _mode_initializers, void 0));
                this.characterId = (__runInitializers(this, _mode_extraInitializers), __runInitializers(this, _characterId_initializers, void 0));
                this.position = (__runInitializers(this, _characterId_extraInitializers), __runInitializers(this, _position_initializers, void 0));
                this.size = (__runInitializers(this, _position_extraInitializers), __runInitializers(this, _size_initializers, void 0));
                this.theme = (__runInitializers(this, _size_extraInitializers), __runInitializers(this, _theme_initializers, void 0));
                this.avatar = (__runInitializers(this, _theme_extraInitializers), __runInitializers(this, _avatar_initializers, void 0));
                this.abTestVariant = (__runInitializers(this, _avatar_extraInitializers), __runInitializers(this, _abTestVariant_initializers, void 0));
                this.analyticsEnabled = (__runInitializers(this, _abTestVariant_extraInitializers), __runInitializers(this, _analyticsEnabled_initializers, void 0));
                this.config = (__runInitializers(this, _analyticsEnabled_extraInitializers), __runInitializers(this, _config_initializers, void 0));
                __runInitializers(this, _config_extraInitializers);
            }
            return CreateWidgetConfigDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsString)()];
            _type_decorators = [(0, class_validator_1.IsEnum)(WidgetType)];
            _mode_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(WidgetMode)];
            _characterId_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _position_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _size_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(function () { return WidgetSizeDto; })];
            _theme_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _avatar_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _abTestVariant_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _analyticsEnabled_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _config_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _mode_decorators, { kind: "field", name: "mode", static: false, private: false, access: { has: function (obj) { return "mode" in obj; }, get: function (obj) { return obj.mode; }, set: function (obj, value) { obj.mode = value; } }, metadata: _metadata }, _mode_initializers, _mode_extraInitializers);
            __esDecorate(null, null, _characterId_decorators, { kind: "field", name: "characterId", static: false, private: false, access: { has: function (obj) { return "characterId" in obj; }, get: function (obj) { return obj.characterId; }, set: function (obj, value) { obj.characterId = value; } }, metadata: _metadata }, _characterId_initializers, _characterId_extraInitializers);
            __esDecorate(null, null, _position_decorators, { kind: "field", name: "position", static: false, private: false, access: { has: function (obj) { return "position" in obj; }, get: function (obj) { return obj.position; }, set: function (obj, value) { obj.position = value; } }, metadata: _metadata }, _position_initializers, _position_extraInitializers);
            __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: function (obj) { return "size" in obj; }, get: function (obj) { return obj.size; }, set: function (obj, value) { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
            __esDecorate(null, null, _theme_decorators, { kind: "field", name: "theme", static: false, private: false, access: { has: function (obj) { return "theme" in obj; }, get: function (obj) { return obj.theme; }, set: function (obj, value) { obj.theme = value; } }, metadata: _metadata }, _theme_initializers, _theme_extraInitializers);
            __esDecorate(null, null, _avatar_decorators, { kind: "field", name: "avatar", static: false, private: false, access: { has: function (obj) { return "avatar" in obj; }, get: function (obj) { return obj.avatar; }, set: function (obj, value) { obj.avatar = value; } }, metadata: _metadata }, _avatar_initializers, _avatar_extraInitializers);
            __esDecorate(null, null, _abTestVariant_decorators, { kind: "field", name: "abTestVariant", static: false, private: false, access: { has: function (obj) { return "abTestVariant" in obj; }, get: function (obj) { return obj.abTestVariant; }, set: function (obj, value) { obj.abTestVariant = value; } }, metadata: _metadata }, _abTestVariant_initializers, _abTestVariant_extraInitializers);
            __esDecorate(null, null, _analyticsEnabled_decorators, { kind: "field", name: "analyticsEnabled", static: false, private: false, access: { has: function (obj) { return "analyticsEnabled" in obj; }, get: function (obj) { return obj.analyticsEnabled; }, set: function (obj, value) { obj.analyticsEnabled = value; } }, metadata: _metadata }, _analyticsEnabled_initializers, _analyticsEnabled_extraInitializers);
            __esDecorate(null, null, _config_decorators, { kind: "field", name: "config", static: false, private: false, access: { has: function (obj) { return "config" in obj; }, get: function (obj) { return obj.config; }, set: function (obj, value) { obj.config = value; } }, metadata: _metadata }, _config_initializers, _config_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateWidgetConfigDto = CreateWidgetConfigDto;
