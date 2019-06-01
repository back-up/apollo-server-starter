import _ from 'lodash'

import { Models } from './../type'
import {
  GraphQLResolveInfo,
  GraphQLWrappingType,
  GraphQLObjectType,
  isObjectType,
  GraphQLType,
  isWrappingType,
  GraphQLField,
  GraphQLFieldMap
} from "graphql"

const graphqlFields = require('graphql-fields')

function getObjectType (type: GraphQLWrappingType): GraphQLObjectType {
  while (!isObjectType(type)) {
    type = type.ofType
  }
  return type
}

export function getModelAttrs (info: GraphQLResolveInfo, models: Models, field?: string): string[] {
  let type: GraphQLType = isWrappingType(info.returnType) ? getObjectType(info.returnType) : info.returnType

  if (field) {
  }

  // TODO interface
  if (!isObjectType(type) || !_.get(type, 'table')) {
    return []
  }

  const requestFields: string[] = Object.keys(graphqlFields(info, {}, { excludedFields: ['__typename'] }))
  const objectFieldMap: GraphQLFieldMap<any, any> = type.getFields()

  const model = models[_.get(type, 'table')]
  // 该 Object 对应数据库 Model 的所有字段
  const modelAttributeMap = model.rawAttributes

  const attrs = _.flatMap<string, string>(requestFields, (field => {
    const { dep }: GraphQLField<any, any> & { dep?: string[] } = _.get(objectFieldMap, field)
    if (!dep) {
      // 如果没有使用 sql directive 对数据库进行标记，则查看该字段是否在数据库的列中存在
      if (modelAttributeMap[field]) {
        return field
      }
      return []
    }
    return dep
  }))

  return _.uniq(attrs)
}
