'use strict';

var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var util = require('util');
var Condition = require('../lib/db/condition'),
  w = Condition,
  f = Condition.FieldString;

var Grammar = require('../lib/db/grammar');
var Translator = require('../lib/db/grammar/translator');

describe('condition', function() {
  beforeEach(function() {
    this.grammar = new (Grammar.extend({
      field: function(field) { return field; },
      value: function(value) {
        return util.format('%j', value);
      }
    }))();
    this.translator = new (Translator.extend({}))();
  });

  describe('creation', function() {
    it('returns the given object if it\'s a condition', function() {
      var c = w({ id: 1 });
      expect(w(c)).to.equal(c);
    });

    it('requires an argument', function() {
      expect(function() { w() }).to.throw(/condition required/i);
    });
  });

  it('can build expressions', function() {
    var c = w({ id: 1 }, { name: 'Whitney' });
    var result = c.build(this.grammar, this.translator).toString();
    expect(result).to.eql('id = 1 and name = "Whitney"');
  });

  describe('fields', function() {
    it('defaults to values for the right-hand-side', function() {
      var c = w({ first: 'value' });
      var result = c.build(this.grammar, this.translator).toString();
      expect(result).to.eql('first = "value"');
    });

    it('accepts fields for the right-hand-side', function() {
      var c = w({ first: f('value') });
      var result = c.build(this.grammar, this.translator).toString();
      expect(result).to.eql('first = value');
    });

    it('converts a simple string to a condition using fields', function() {
      var c = w('first=value');
      var result = c.build(this.grammar, this.translator).toString();
      expect(result).to.eql('first = value');
    });
  });

  describe('predicates', function() {
    it('extracts predicates', function() {
      var details = Condition._extractPredicate('id[gt]');
      expect(details.key).to.eql('id');
      expect(details.predicate).to.equal('gt');
    });

    it('defaults to exact', function() {
      var details = Condition._extractPredicate('address');
      expect(details.key).to.eql('address');
      expect(details.predicate).to.equal('exact');
    });

    // TODO: test the following:
    //   exact
    //   iexact
    //   contains
    //   icontains
    //   in
    //   gt
    //   gte
    //   lt
    //   lte
    //   startswith
    //   istartswith
    //   endswith
    //   iendswith
    //   range
    //   year
    //   month
    //   day
    //   week_day
    //   hour
    //   minute
    //   second
    //   isnull
    //   search
    //   regex
    //   iregex
    //   between (for both numbers and dates)

    // TODO: should this be via the adapter, the query, or the condition?
    it('raises for unsupported predicates');
  });

  describe('operators', function() {
    it('implicitly adds an "and"  joining conditions', function() {
      var result = w({ first: 'Whitney' }, { last: 'Young' })
        .build(this.grammar, this.translator)
        .toString();
      expect(result).to.eql('first = "Whitney" and last = "Young"');
    });

    it('supports "and"  joining conditions', function() {
      var result = w({ first: 'Whitney' }, w.and, { last: 'Young' })
        .build(this.grammar, this.translator)
        .toString();
      expect(result).to.eql('first = "Whitney" and last = "Young"');
    });

    it('does not support "and" prefixing conditions', function() {
      expect(function() {
        w(w.and, { first: 'Whitney' });
      }.bind(this)).to.throw(/"and".*must include left hand/i);
    });

    it('does not support "and" without right hand', function() {
      expect(function() {
        w({ first: 'Whitney' }, w.and);
      }.bind(this)).to.throw(/"and".*must include right hand/i);
    });

    it('does not support "and" without an expression', function() {
      expect(function() { w(w.and); })
        .to.throw(/"and".*must include left hand/i);
    });

    it('supports "or" joining conditions', function() {
      var result = w({ first: 'Whitney' }, w.or, { first: 'Whit' })
        .build(this.grammar, this.translator)
        .toString();
      expect(result).to.eql('first = "Whitney" or first = "Whit"');
    });

    it('does not support "or" prefixing conditions', function() {
      expect(function() {
        w(w.or, { first: 'Whitney' });
      }.bind(this)).to.throw(/"or".*must include left hand/i);
    });

    it('does not support "or" without an expression', function() {
      expect(function() { w(w.or); })
        .to.throw(/"or".*must include left hand/i);
    });

    it('does not support "or" without right hand', function() {
      expect(function() {
        w({ first: 'Whitney' }, w.or);
      }.bind(this)).to.throw(/"or".*must include right hand/i);
    });
    it('requires explicit binary operation when "not" is between conditions', function() {
      expect(function() {
        w({ first: 'Whitney' }, w.not, { first: 'Whit' });
      }.bind(this)).to.throw(/"not".*between expressions/);
    });

    it('supports "not" prefixing conditions', function() {
      var result = w(w.not, { first: 'Whitney' }).build(this.grammar, this.translator).toString();
      expect(result).to.eql('not first = "Whitney"');
    });

    it('does not support "not" followed by "and"', function() {
      expect(function() {
        w({ first: 'Whitney' }, w.or, w.not, w.and, { first: 'Whit' });
      }.bind(this)).to.throw(/"and".*cannot follow.*"not"/);
    });

    it('does not support "not" without an expression', function() {
      expect(function() { w(w.not); })
        .to.throw(/"not".*must precede expression/);
    });

    it('does not support multiple binary operators in a row', function() {
      expect(function() {
        w({ first: 'Whitney' }, w.and, w.or, { first: 'Whit' });
      }.bind(this)).to.throw(/"or".*invalid after.*"and"/);
    });

    it('does supports multiple unary operators in a row', function() {
      var result = w(w.not, w.not, { first: 'Whitney' })
        .build(this.grammar, this.translator)
        .toString();
      expect(result).to.eql('not not first = "Whitney"');
    });
  });

  describe('sub-conditions', function() {
    it('builds complex expressions', function() {
      var firstPredicate = w({ first: 'Whit' }, w.or, { first: 'Whitney' });
      var lastPredicate = { last: 'Young' };
      var fullPredicate = w(firstPredicate, w.and, lastPredicate);

      var result = fullPredicate.build(this.grammar, this.translator).toString();

      expect(result).to.eql('(first = "Whit" or first = "Whitney") and last = "Young"');
    });

    it('allows arrays to form groupings', function() {
      var firstPredicate = [{ first: 'Whit' }, w.or, { first: 'Whitney' }];
      var lastPredicate = { last: 'Young' };
      var fullPredicate = w(firstPredicate, w.and, lastPredicate);

      var result = fullPredicate.build(this.grammar, this.translator).toString();

      expect(result).to.eql('(first = "Whit" or first = "Whitney") and last = "Young"');
    });

    it('handles neighboring conditions', function() {
      var predicate = w(w({ first: 'Whitney' }), w({ last: 'Young' }));
      var result = predicate.build(this.grammar, this.translator).toString();

      expect(result).to.eql('(first = "Whitney") and (last = "Young")');
    });
  });

  describe('syntax builder', function() {
    it('properly groups binary operators', function() {
      var c = w({ id: 1 }, w.and, { id: 2 });
      expect(c._tree).to.have.deep.property('tree.operator', 'and');
      expect(c._tree).to.have.deep.property('tree.lhs.rhs.value', 1);
      expect(c._tree).to.have.deep.property('tree.rhs.rhs.value', 2);
    });

    it('properly groups binary operators', function() {
      var c = w({ id: 1 }, w.and, { id: 2 }, w.and, { id: 3 });
      expect(c._tree).to.have.deep.property('tree.operator', 'and');
      expect(c._tree).to.have.deep.property('tree.lhs.operator', 'and');
      expect(c._tree).to.have.deep.property('tree.lhs.lhs.rhs.value', 1);
      expect(c._tree).to.have.deep.property('tree.lhs.rhs.rhs.value', 2);
      expect(c._tree).to.have.deep.property('tree.rhs.rhs.value', 3);
    });

    it('properly groups unary and binary operators', function() {
      var c = w(w.not, w.not, { id: 1 }, { id: 2 });
      expect(c._tree).to.have.deep.property('tree.operator', 'and');
      expect(c._tree).to.have.deep.property('tree.lhs.operator', 'not');
      expect(c._tree).to.have.deep.property('tree.lhs.operand.operator', 'not');
      expect(c._tree).to.have.deep.property('tree.lhs.operand.operand.rhs.value', 1);
      expect(c._tree).to.have.deep.property('tree.rhs.rhs.value', 2);
    });
  });
});
